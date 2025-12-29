/**
 * ChatHistoryService - 채팅 내역 저장 및 관리 서비스
 * 로컬 스토리지와 서버 양쪽에 채팅 세션과 메시지를 저장합니다.
 */

import { ChatMessage } from './ChatService';
import { CHAT_API_URL } from '../../common/constants';
import { tokenService } from './tokenService';

export interface ChatSession {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messages: ChatMessage[];
    sessionId?: string; // 서버 세션 ID
}

class ChatHistoryService {
    private static readonly STORAGE_KEY = 'chat_history';
    private static readonly MAX_SESSIONS = 100; // 최대 저장 세션 수
    private static readonly SERVER_SYNC_KEY = 'server_sync_enabled'; // 서버 동기화 활성화 여부

    /**
     * 모든 채팅 세션 가져오기
     */
    public getAllSessions(): ChatSession[] {
        try {
            const stored = localStorage.getItem(ChatHistoryService.STORAGE_KEY);
            if (!stored) return [];

            const sessions = JSON.parse(stored);
            // Date 객체 복원
            return sessions.map((session: any) => ({
                ...session,
                createdAt: new Date(session.createdAt),
                updatedAt: new Date(session.updatedAt),
                messages: session.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                })),
            }));
        } catch (error) {
            console.error('[ChatHistoryService] Error loading sessions:', error);
            return [];
        }
    }

    /**
     * 특정 채팅 세션 가져오기
     */
    public getSession(sessionId: string): ChatSession | null {
        const sessions = this.getAllSessions();
        return sessions.find(s => s.id === sessionId) || null;
    }

    /**
     * 새 채팅 세션 생성
     */
    public createSession(title?: string): ChatSession {
        const session: ChatSession = {
            id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: title || '새 대화',
            createdAt: new Date(),
            updatedAt: new Date(),
            messages: [],
        };

        const sessions = this.getAllSessions();
        sessions.unshift(session); // 최신 세션이 맨 위에

        // 최대 세션 수 제한
        if (sessions.length > ChatHistoryService.MAX_SESSIONS) {
            sessions.splice(ChatHistoryService.MAX_SESSIONS);
        }

        this.saveSessions(sessions);
        return session;
    }

    /**
     * 채팅 세션에 메시지 추가
     */
    public async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
        const sessions = this.getAllSessions();
        const session = sessions.find(s => s.id === sessionId);

        if (!session) {
            console.warn(`[ChatHistoryService] Session not found: ${sessionId}`);
            return;
        }

        session.messages.push(message);
        session.updatedAt = new Date();

        // 첫 번째 AI 응답이면 제목 자동 생성
        if (session.messages.length === 2 && message.role === 'assistant') {
            const firstUserMessage = session.messages.find(m => m.role === 'user');
            if (firstUserMessage) {
                session.title = firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
            }
        }

        // 로컬 저장
        this.saveSessions(sessions);

        // 서버에도 저장 (비동기, 실패해도 로컬 저장은 유지)
        if (session.sessionId) {
            this.saveMessageToServer(session.sessionId, message).catch(error => {
                console.warn('[ChatHistoryService] Failed to save message to server:', error);
            });
        }
    }

    /**
     * 채팅 세션 업데이트
     */
    public updateSession(sessionId: string, updates: Partial<ChatSession>): void {
        const sessions = this.getAllSessions();
        const session = sessions.find(s => s.id === sessionId);

        if (!session) {
            console.warn(`[ChatHistoryService] Session not found: ${sessionId}`);
            return;
        }

        Object.assign(session, updates);
        session.updatedAt = new Date();
        this.saveSessions(sessions);
    }

    /**
     * 채팅 세션 삭제
     */
    public deleteSession(sessionId: string): void {
        const sessions = this.getAllSessions();
        const filtered = sessions.filter(s => s.id !== sessionId);
        this.saveSessions(filtered);
    }

    /**
     * 모든 채팅 세션 삭제
     */
    public clearAllSessions(): void {
        localStorage.removeItem(ChatHistoryService.STORAGE_KEY);
    }

    /**
     * 세션 저장
     */
    private saveSessions(sessions: ChatSession[]): void {
        try {
            localStorage.setItem(ChatHistoryService.STORAGE_KEY, JSON.stringify(sessions));
        } catch (error) {
            console.error('[ChatHistoryService] Error saving sessions:', error);
            // 스토리지 용량 초과 시 오래된 세션 삭제
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                const reduced = sessions.slice(0, Math.floor(sessions.length * 0.8));
                this.saveSessions(reduced);
            }
        }
    }

    /**
     * 현재 활성 세션 ID 가져오기 (최근 세션)
     */
    public getCurrentSessionId(): string | null {
        const sessions = this.getAllSessions();
        return sessions.length > 0 ? sessions[0].id : null;
    }

    /**
     * 현재 활성 세션 가져오기 또는 생성
     */
    public getOrCreateCurrentSession(): ChatSession {
        const sessions = this.getAllSessions();
        if (sessions.length > 0) {
            return sessions[0];
        }
        return this.createSession();
    }

    /**
     * 서버에 메시지 저장
     */
    private async saveMessageToServer(serverSessionId: string, message: ChatMessage): Promise<void> {
        try {
            const accessToken = tokenService.getAccessToken();
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            const response = await fetch(`${CHAT_API_URL}/sessions/${serverSessionId}/messages`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    role: message.role,
                    content: message.content,
                }),
            });

            if (!response.ok) {
                throw new Error(`Server save failed: ${response.status}`);
            }
        } catch (error) {
            console.error('[ChatHistoryService] Error saving to server:', error);
            throw error;
        }
    }

    /**
     * 서버에서 세션의 메시지 조회
     */
    public async getMessagesFromServer(serverSessionId: string, limit: number = 100): Promise<ChatMessage[]> {
        try {
            const accessToken = tokenService.getAccessToken();
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            const response = await fetch(`${CHAT_API_URL}/sessions/${serverSessionId}/messages?limit=${limit}`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(`Server fetch failed: ${response.status}`);
            }

            const data = await response.json();
            return data.messages.map((msg: any) => ({
                id: `msg_${msg.created_at}_${Math.random().toString(36).substr(2, 9)}`,
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: new Date(msg.created_at),
            }));
        } catch (error) {
            console.error('[ChatHistoryService] Error fetching from server:', error);
            return [];
        }
    }

    /**
     * 세션의 서버 세션 ID 설정
     */
    public setServerSessionId(localSessionId: string, serverSessionId: string): void {
        const sessions = this.getAllSessions();
        const session = sessions.find(s => s.id === localSessionId);
        if (session) {
            session.sessionId = serverSessionId;
            this.saveSessions(sessions);
        }
    }
}

export default new ChatHistoryService();

