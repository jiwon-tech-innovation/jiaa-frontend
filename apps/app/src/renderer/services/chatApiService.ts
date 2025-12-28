// Chat API 서비스 - FastAPI 채팅 서버와 통신
import { CHAT_API_URL } from '../../common/constants';
import { tokenService } from './tokenService';

// API Base URL (CHAT_API_URL에서 /chat 제거)
const API_BASE_URL = CHAT_API_URL.replace('/chat', '');

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    response: string;
    error?: string;
}

export interface RoadmapResponse {
    name?: string;
    roadmap?: Array<{
        day: number;
        content: string;
        time: string;
        timestamp?: string; // 첫 번째 항목(day: 1)에만 포함
    }>;
}

/**
 * 채팅 메시지를 전송하고 AI 응답을 받아옵니다.
 */
export async function sendChatMessage(
    message: string,
    sessionId: string
): Promise<ChatResponse> {
    try {
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
                message,
                session_id: sessionId,
            }),
        });

        if (!response.ok) {
            // 에러 응답의 상세 내용을 가져오기
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // JSON 파싱 실패 시 기본 메시지 사용
                const text = await response.text().catch(() => '');
                if (text) {
                    errorMessage = `${errorMessage}: ${text}`;
                }
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return {
            response: data.response || '',
        };
    } catch (error) {
        console.error('Chat API 호출 오류:', error);
        return {
            response: '',
            error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        };
    }
}

/**
 * 로드맵 모드를 시작합니다.
 */
export async function startRoadmapMode(sessionId: string): Promise<string | null> {
    try {
        const response = await fetch(`${CHAT_API_URL}/roadmap/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.session_id || sessionId;
    } catch (error) {
        console.error('로드맵 모드 시작 오류:', error);
        return null;
    }
}

/**
 * 응답 텍스트에서 로드맵 JSON을 파싱합니다.
 */
export function parseRoadmapResponse(text: string): RoadmapResponse | null {
    try {
        // JSON 블록 찾기 (```json ... ``` 또는 {...})
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*"roadmap"[\s\S]*\}/);
        if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            const parsed = JSON.parse(jsonStr);
            if (parsed.roadmap && Array.isArray(parsed.roadmap)) {
                return parsed;
            }
        }
    } catch (error) {
        console.error('[Roadmap] JSON 파싱 오류:', error);
    }
    return null;
}

/**
 * 로드맵 목록을 조회합니다.
 */
export async function getRoadmaps(userId?: string): Promise<any[]> {
    try {
        const url = userId 
            ? `${API_BASE_URL}/roadmaps?user_id=${userId}`
            : `${API_BASE_URL}/roadmaps`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('로드맵 목록 조회 오류:', error);
        return [];
    }
}

/**
 * 특정 로드맵을 조회합니다.
 */
export async function getRoadmap(roadmapId: string): Promise<any | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/roadmaps/${roadmapId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('로드맵 조회 오류:', error);
        return null;
    }
}

/**
 * 로드맵 항목의 완료 상태를 업데이트합니다.
 */
export async function updateRoadmapItem(roadmapItemId: string, isCompleted: boolean): Promise<any | null> {
    try {
        // roadmapItemId 형식: "roadmap_id:item_index" (예: "507f1f77bcf86cd799439011:0")
        const response = await fetch(`${API_BASE_URL}/roadmaps/items/${roadmapItemId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                is_completed: isCompleted
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('로드맵 항목 업데이트 오류:', error);
        return null;
    }
}

