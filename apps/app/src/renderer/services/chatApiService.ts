// Chat API 서비스 - FastAPI 채팅 서버와 통신
import { AI_CHAT_API_BASE_URL, AI_CHAT_ENDPOINTS, CHAT_API_URL } from '../../common/constants';
import { tokenService } from './tokenService';

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
        const response = await fetch(`${CHAT_API_URL}${AI_CHAT_ENDPOINTS.ROADMAP_START}`, {
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
            ? `${AI_CHAT_API_BASE_URL}${AI_CHAT_ENDPOINTS.ROADMAPS}?user_id=${userId}`
            : `${AI_CHAT_API_BASE_URL}${AI_CHAT_ENDPOINTS.ROADMAPS}`;

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
        const response = await fetch(`${AI_CHAT_API_BASE_URL}${AI_CHAT_ENDPOINTS.ROADMAPS}/${roadmapId}`, {
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
        const response = await fetch(`${AI_CHAT_API_BASE_URL}${AI_CHAT_ENDPOINTS.ROADMAPS}/items/${roadmapItemId}`, {
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

/**
 * 활동 통계 인터페이스
 */
export interface ActivityStats {
    currentStreak: number;
    completedDays: number;
    totalDays: number;
    completedItems: number;
    contributionData: number[][];
}

/**
 * 사용자의 활동 통계를 조회합니다 (FastAPI).
 * - currentStreak: 현재 연속 학습일수
 * - completedDays: 완료한 학습일수
 * - totalDays: 전체 로드맵 일수
 * - contributionData: 연도별 활동 데이터 (ContributionGraph용)
 */
export async function getActivityStats(userId?: string, year?: number): Promise<ActivityStats> {
    try {
        let url = `${AI_CHAT_API_BASE_URL}${AI_CHAT_ENDPOINTS.STATS}`;
        const params = new URLSearchParams();

        if (userId) {
            params.append('user_id', userId);
        }
        if (year) {
            params.append('year', year.toString());
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

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
        return {
            currentStreak: data.current_streak || 0,
            completedDays: data.completed_days || 0,
            totalDays: data.total_days || 0,
            completedItems: data.completed_items || 0,
            contributionData: data.contribution_data || [],
        };
    } catch (error) {
        console.error('활동 통계 조회 오류:', error);
        return {
            currentStreak: 0,
            completedDays: 0,
            totalDays: 0,
            completedItems: 0,
            contributionData: [],
        };
    }
}
