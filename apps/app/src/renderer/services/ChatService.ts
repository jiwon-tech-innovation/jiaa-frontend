/**
 * ChatService - WebSocket 기반 채팅 서비스
 * 
 * 현재는 로컬 에코 모드로 동작하며, 나중에 WebSocket 서버 연결 시
 * connect() 메서드의 URL을 변경하고 handleMessage를 수정하면 됩니다.
 */

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
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

    private constructor() { }

    public static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }

    /**
     * WebSocket 서버에 연결
     * @param url WebSocket 서버 URL (예: 'ws://localhost:8080/chat')
     */
    public connect(url?: string): void {
        // TODO: 실제 WebSocket 서버 URL로 변경
        // 현재는 연결 시뮬레이션만 수행
        if (!url) {
            console.log('[ChatService] No URL provided, running in local mode');
            this.setStatus('connected');
            return;
        }

        if (this.ws && this.status === 'connected') {
            console.log('[ChatService] Already connected');
            return;
        }

        console.log(`[ChatService] Attempting to connect to: ${url}`);
        this.setStatus('connecting');

        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log('[ChatService] Connected to server');
                this.reconnectAttempts = 0;
                this.setStatus('connected');
            };

            this.ws.onmessage = (event) => {
                this.handleIncomingMessage(event.data);
            };

            this.ws.onclose = () => {
                console.log('[ChatService] Connection closed');
                this.setStatus('disconnected');
                this.attemptReconnect(url);
            };

            this.ws.onerror = (error) => {
                console.error('[ChatService] WebSocket error:', error);
                this.setStatus('error');
            };
        } catch (error) {
            console.error('[ChatService] Failed to connect:', error);
            this.setStatus('error');
        }
    }

    /**
     * WebSocket 연결 해제
     */
    public disconnect(): void {
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
            this.ws.send(JSON.stringify({
                type: 'message',
                content: message.content,
            }));
        } else {
            // 로컬 모드: 에코 응답 시뮬레이션
            this.simulateResponse(message.content);
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

    // ==================== Private Methods ====================

    private setStatus(status: ConnectionStatus): void {
        this.status = status;
        this.statusHandlers.forEach(handler => handler(status));
    }

    private handleIncomingMessage(data: string): void {
        try {
            const parsed = JSON.parse(data);
            const message: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: parsed.content || parsed.message || data,
                timestamp: new Date(),
            };
            this.notifyMessageHandlers(message);
        } catch {
            // JSON이 아닌 경우 문자열 그대로 처리
            const message: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: data,
                timestamp: new Date(),
            };
            this.notifyMessageHandlers(message);
        }
    }

    private notifyMessageHandlers(message: ChatMessage): void {
        this.messageHandlers.forEach(handler => handler(message));
    }

    private simulateResponse(userMessage: string): void {
        // 로컬 모드에서의 시뮬레이션 응답
        // TODO: 실제 WebSocket 연결 시 이 메서드는 사용되지 않음
        setTimeout(() => {
            const responses = [
                '안녕하세요! 무엇을 도와드릴까요?',
                '네, 알겠습니다!',
                '흥미로운 질문이네요!',
                '더 자세히 설명해 주실 수 있나요?',
                '음... 생각해볼게요!',
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            const message: ChatMessage = {
                id: this.generateId(),
                role: 'assistant',
                content: randomResponse,
                timestamp: new Date(),
            };
            this.notifyMessageHandlers(message);
        }, 1000 + Math.random() * 1000);
    }

    private attemptReconnect(url: string): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[ChatService] Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`[ChatService] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect(url);
        }, this.reconnectDelay);
    }

    private generateId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export default ChatService;
