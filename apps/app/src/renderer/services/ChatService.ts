/**
 * ChatService - WebSocket 기반 채팅 서비스
 * 
 * WebSocket 연결이 실패하면 HTTP API를 fallback으로 사용합니다.
 */

import { CHAT_API_URL, CHAT_WS_URL } from '../../common/constants';
import { tokenService } from './tokenService';

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    isStreaming?: boolean; // 스트리밍 중인지 여부
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type MessageHandler = (message: ChatMessage) => void;
export type StatusHandler = (status: ConnectionStatus) => void;

class ChatService {
    private static instance: ChatService | null = null;
    private ws: WebSocket | null = null;
    private status: ConnectionStatus = 'disconnected';
    private messageHandlers: Set<MessageHandler> = new Set();
    private statusHandlers: Set<StatusHandler> = new Set();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private sessionId: string | undefined;
    private currentStreamingMessage: ChatMessage | null = null; // 현재 스트리밍 중인 메시지
    private typingQueue: string[] = []; // 타이핑 큐 (한 글자씩 표시하기 위한 큐)
    private typingInterval: NodeJS.Timeout | null = null; // 타이핑 인터벌
    private pendingChunks: string = ''; // 아직 처리되지 않은 청크
    private isPaused: boolean = false; // 타이핑 일시 정지 여부
    private isStreamComplete: boolean = false; // 스트리밍 데이터 수신 완료 여부

    private constructor() { }

    public static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }

    /**
     * WebSocket 서버에 연결
     * @param url WebSocket 서버 URL (예: 'ws://localhost:8000/ws/chat')
     *            제공되지 않으면 constants의 CHAT_WS_URL 사용
     */
    public connect(url?: string): void {
        // URL이 제공되지 않으면 기본값 사용
        const targetUrl = url || CHAT_WS_URL;

        if (!targetUrl) {
            console.log('[ChatService] No WebSocket URL provided, will use HTTP API fallback');
            this.setStatus('disconnected');
            return;
        }

        // 이미 연결되어 있으면 재연결하지 않음
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('[ChatService] Already connected');
            return;
        }

        // 기존 연결이 있으면 정리
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        console.log(`[ChatService] Attempting to connect to: ${targetUrl}`);
        this.setStatus('connecting');

        try {
            this.ws = new WebSocket(targetUrl);

            this.ws.onopen = () => {
                console.log('[ChatService] WebSocket connected to server');
                this.reconnectAttempts = 0;
                this.setStatus('connected');
            };

            this.ws.onmessage = (event) => {
                this.handleIncomingMessage(event.data);
            };

            this.ws.onclose = (event) => {
                console.log('[ChatService] WebSocket connection closed', event.code, event.reason);
                this.setStatus('disconnected');

                // 정상 종료가 아니면 재연결 시도
                if (event.code !== 1000) {
                    this.attemptReconnect(targetUrl);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[ChatService] WebSocket error:', error);
                this.setStatus('error');
                // 에러 발생 시 재연결 시도
                setTimeout(() => {
                    if (this.status === 'error') {
                        this.attemptReconnect(targetUrl);
                    }
                }, this.reconnectDelay);
            };
        } catch (error) {
            console.error('[ChatService] Failed to create WebSocket:', error);
            this.setStatus('error');
            // 연결 실패 시 재연결 시도
            this.attemptReconnect(targetUrl);
        }
    }

    /**
     * WebSocket 연결 해제
     */
    public disconnect(): void {
        // 타이핑 애니메이션 정리
        this.stopTypingAnimation();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.setStatus('disconnected');
    }

    /**
     * 메시지 전송
     * @param content 전송할 메시지 내용
     */
    public sendMessage(content: string): ChatMessage {
        const message: ChatMessage = {
            id: this.generateId(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        // WebSocket이 연결되어 있으면 서버로 전송
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // JWT 토큰 가져오기
            const accessToken = tokenService.getAccessToken();
            const wsMessage: any = {
                message: message.content, // 백엔드는 'message' 필드를 기대함
                session_id: this.sessionId, // 세션 유지
            };

            // 토큰이 있으면 포함
            if (accessToken) {
                wsMessage.token = accessToken;
            }

            this.ws.send(JSON.stringify(wsMessage));
        } else {
            // WebSocket이 연결되지 않았으면 HTTP API 사용
            this.sendMessageViaHttp(message.content);
        }

        return message;
    }

    /**
     * 메시지 수신 핸들러 등록
     */
    public onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    /**
     * 연결 상태 변경 핸들러 등록
     */
    public onStatusChange(handler: StatusHandler): () => void {
        this.statusHandlers.add(handler);
        // 현재 상태 즉시 전달
        handler(this.status);
        return () => this.statusHandlers.delete(handler);
    }

    /**
     * 현재 연결 상태 반환
     */
    public getStatus(): ConnectionStatus {
        return this.status;
    }

    /**
     * 서버 연결 상태 확인 (헬스체크)
     */
    public async checkServerHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${CHAT_API_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * 세션 모드 업데이트 (chat <-> roadmap)
     * @param mode 설정할 모드
     */
    public async updateChatMode(mode: 'chat' | 'roadmap'): Promise<boolean> {
        if (!this.sessionId) {
            console.warn('[ChatService] Cannot update mode: Session ID not available');
            return false;
        }

        try {
            const response = await fetch(`${CHAT_API_URL}/sessions/${this.sessionId}/mode`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mode }),
            });

            if (response.ok) {
                console.log(`[ChatService] Updated chat mode to: ${mode}`);
                return true;
            } else {
                console.error('[ChatService] Failed to update mode:', response.status);
                return false;
            }
        } catch (error) {
            console.error('[ChatService] Error updating mode:', error);
            return false;
        }
    }

    // ==================== Private Methods ====================

    private setStatus(status: ConnectionStatus): void {
        this.status = status;
        this.statusHandlers.forEach(handler => handler(status));
    }

    private handleIncomingMessage(data: string): void {
        try {
            const parsed = JSON.parse(data);

            // 세션 ID가 오면 저장
            if (parsed.type === 'session' && parsed.session_id) {
                this.sessionId = parsed.session_id;
                console.log(`[ChatService] Session initialized: ${this.sessionId}`);
                return;
            }

            // 오류 메시지 처리
            if (parsed.type === 'error') {
                console.error(`[ChatService] Server error: ${parsed.error}`);
                return;
            }

            // 스트리밍 청크 처리
            if (parsed.type === 'chunk' && parsed.text !== undefined) {
                console.log(`[ChatService] Received chunk: "${parsed.text.substring(0, 30)}..."`);

                if (!this.currentStreamingMessage) {
                    // 새로운 스트리밍 메시지 시작
                    const messageId = this.generateId();
                    this.currentStreamingMessage = {
                        id: messageId,
                        role: 'assistant',
                        content: '',
                        timestamp: new Date(),
                        isStreaming: true,
                    };
                    console.log(`[ChatService] Started new streaming message: ${messageId}`);

                    // 타이핑 인터벌 시작
                    this.startTypingAnimation();
                }

                this.isStreamComplete = false;

                // 청크의 각 글자를 큐에 추가
                const chunkText = parsed.text;
                for (let i = 0; i < chunkText.length; i++) {
                    this.typingQueue.push(chunkText[i]);
                }

                return;
            }

            // 완전한 메시지 처리 (스트리밍 완료 또는 일반 메시지)
            if (parsed.type === 'message' && parsed.response) {
                // 스트리밍이 완료된 경우
                if (this.currentStreamingMessage) {
                    // 즉시 flush 하지 않고, 스트리밍 완료 플래그만 설정
                    // 타이핑 애니메이션이 남은 큐를 모두 소진하고 자연스럽게 종료되도록 함
                    this.isStreamComplete = true;
                    console.log('[ChatService] Stream complete signal received. Waiting for typing queue to empty...');
                } else {
                    // 일반 메시지 (타이핑 효과 적용)
                    this.typeMessage(parsed.response);
                }
                return;
            }

            // 기타 메시지 처리
            const message: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: parsed.response || parsed.content || parsed.message || data,
                timestamp: new Date(),
                isStreaming: false,
            };
            this.notifyMessageHandlers(message);
        } catch {
            // JSON이 아닌 경우 문자열 그대로 처리
            const message: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: data,
                timestamp: new Date(),
                isStreaming: false,
            };
            this.notifyMessageHandlers(message);
        }
    }

    private notifyMessageHandlers(message: ChatMessage): void {
        this.messageHandlers.forEach(handler => handler(message));
    }

    /**
     * HTTP API를 통한 메시지 전송 (WebSocket fallback)
     */
    private async sendMessageViaHttp(userMessage: string): Promise<void> {
        try {
            console.log('[ChatService] Using HTTP API fallback to:', CHAT_API_URL);

            // JWT 토큰 가져오기
            const accessToken = tokenService.getAccessToken();
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            // Authorization 헤더 추가 (토큰이 있는 경우)
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            const response = await fetch(CHAT_API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message: userMessage,
                    session_id: this.sessionId,
                }),
            });

            console.log('[ChatService] HTTP response status:', response.status, response.statusText);

            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                    const errorData = JSON.parse(errorText);
                    // 서버에서 반환한 상세 오류 메시지 사용
                    if (errorData.detail) {
                        throw new Error(`서버 오류 (${response.status}): ${errorData.detail}`);
                    }
                } catch (parseError) {
                    // JSON 파싱 실패 시 원본 텍스트 사용
                }
                throw new Error(`HTTP ${response.status} ${response.statusText}${errorText ? ': ' + errorText : ''}`);
            }

            const data = await response.json();
            console.log('[ChatService] HTTP response data:', data);

            // 세션 ID 저장
            if (data.session_id && !this.sessionId) {
                this.sessionId = data.session_id;
                console.log(`[ChatService] Session initialized via HTTP: ${this.sessionId}`);
            }

            // 응답 메시지 생성
            const message: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: data.response || data.message || '응답을 받을 수 없습니다.',
                timestamp: new Date(),
            };

            this.notifyMessageHandlers(message);
        } catch (error: any) {
            console.error('[ChatService] HTTP API request failed:', error);
            console.error('[ChatService] Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
            });

            // 더 자세한 에러 메시지 생성
            let errorMessage = '서버에 연결할 수 없습니다.';

            // 네트워크 오류 (서버가 실행되지 않음)
            if (error.message?.includes('Failed to fetch') ||
                error.message?.includes('NetworkError') ||
                error.message?.includes('Network request failed') ||
                error.name === 'TypeError') {
                errorMessage = `서버에 연결할 수 없습니다.\n\nFastAPI 서버가 실행 중인지 확인해주세요:\n${CHAT_API_URL}\n\n서버 실행 명령어:\ncd jiaa-fastapi/ai-chat-service\nuvicorn main:app --host 0.0.0.0 --port 8000 --reload`;
            }
            // HTTP 오류 (서버는 실행 중이지만 오류 발생)
            else if (error.message?.includes('HTTP') || error.message?.includes('서버 오류')) {
                errorMessage = error.message;
            }
            // 기타 오류
            else {
                errorMessage = `연결 오류: ${error.message || '알 수 없는 오류'}`;
            }

            // 에러 메시지 표시
            const errorMsg: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: errorMessage,
                timestamp: new Date(),
            };
            this.notifyMessageHandlers(errorMsg);
        }
    }

    private attemptReconnect(url: string): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[ChatService] Max reconnect attempts reached. Will use HTTP API fallback.');
            this.setStatus('disconnected');
            return;
        }

        this.reconnectAttempts++;
        console.log(`[ChatService] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            // 재연결 시도
            this.connect(url);
        }, this.reconnectDelay);
    }

    private generateId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 타이핑 애니메이션 시작 (한 글자씩 표시)
     */
    private startTypingAnimation(): void {
        // 기존 인터벌이 있으면 정리
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }

        // 한글은 약간 느리게, 영문/숫자는 빠르게
        this.typingInterval = setInterval(() => {
            if (this.typingQueue.length === 0) {
                // 큐가 비었고 스트리밍이 완료되었다면 종료 처리
                if (this.isStreamComplete) {
                    this.stopTypingAnimation();

                    if (this.currentStreamingMessage) {
                        this.currentStreamingMessage.isStreaming = false;
                        this.notifyMessageHandlers({ ...this.currentStreamingMessage });
                        this.currentStreamingMessage = null;
                    }
                    this.isStreamComplete = false;
                    console.log('[ChatService] Typing animation finished naturally.');
                }
                return;
            }

            // 일시 정지 상태면 대기
            if (this.isPaused) {
                return;
            }

            // 메시지 객체가 없으면 새로 생성 (새 말풍선)
            if (!this.currentStreamingMessage) {
                const messageId = this.generateId();
                this.currentStreamingMessage = {
                    id: messageId,
                    role: 'assistant',
                    content: '',
                    timestamp: new Date(),
                    isStreaming: true,
                };
            }

            // 큐에서 한 글자 가져오기
            const char = this.typingQueue.shift();
            if (!char) return;

            // 메시지에 글자 추가
            this.currentStreamingMessage.content += char;

            // 핸들러에 업데이트된 메시지 전달
            this.notifyMessageHandlers({
                ...this.currentStreamingMessage,
                id: this.currentStreamingMessage.id
            });

            // 문장 부호 확인 (마침표, 쉼표, 물음표, 느낌표)
            // 다음 글자가 있을 때만 분리 (마지막 글자면 분리 안 함)
            // 문장 부호 확인 및 분리 로직 제거 (사용자 요청: 깜빡임 제거)
            /*
            if (['.', '!', '?', ','].includes(char) && this.typingQueue.length > 0) {
                // ... (Removed bubble splitting logic)
            }
            */
        }, 50); // 50ms마다 한 글자씩
    }

    /**
     * 타이핑 애니메이션 중지
     */
    private stopTypingAnimation(): void {
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
            this.typingInterval = null;
        }
        this.typingQueue = [];
        this.pendingChunks = '';
    }

    /**
     * 큐에 남은 모든 글자를 즉시 처리
     */
    private flushTypingQueue(): void {
        if (!this.currentStreamingMessage) {
            return;
        }

        // 큐의 모든 글자를 한 번에 추가
        while (this.typingQueue.length > 0) {
            const char = this.typingQueue.shift();
            if (char) {
                this.currentStreamingMessage.content += char;
            }
        }

        // 최종 업데이트
        this.notifyMessageHandlers({
            ...this.currentStreamingMessage,
            id: this.currentStreamingMessage.id
        });
    }

    /**
     * 일반 메시지를 타이핑 효과로 표시
     */
    private typeMessage(content: string): void {
        const messageId = this.generateId();
        this.currentStreamingMessage = {
            id: messageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
        };

        // 모든 글자를 큐에 추가
        for (let i = 0; i < content.length; i++) {
            this.typingQueue.push(content[i]);
        }

        // 타이핑 시작
        this.startTypingAnimation();

        // 메시지가 완료되면 스트리밍 종료
        setTimeout(() => {
            if (this.currentStreamingMessage && this.currentStreamingMessage.id === messageId) {
                this.flushTypingQueue();
                this.currentStreamingMessage.isStreaming = false;
                this.notifyMessageHandlers({ ...this.currentStreamingMessage });
                this.stopTypingAnimation();
                this.currentStreamingMessage = null;
            }
        }, content.length * 50 + 100); // 모든 글자가 표시될 시간 + 여유
    }
}

export default ChatService;
