// API Service - Auth Service Integration

import { API_BASE_URL, API_ENDPOINTS } from '../../common/constants';
import { tokenService } from './tokenService';

// API Response wrapper
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// Auth Types
interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    email: string;
}

interface SignUpResponse {
    username: string;
    email: string;
}

// Request Types
interface SignInRequest {
    usernameOrEmail: string;
    password: string;
}

interface SignUpRequest {
    username: string;
    email: string;
    password: string;
    name: string;
}

interface SendVerificationCodeRequest {
    email: string;
}

interface VerifyEmailRequest {
    email: string;
    code: string;
}

// API Error class
export class ApiError extends Error {
    constructor(
        public message: string,
        public success: boolean = false,
        public statusCode?: number
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// 인증이 필요 없는 엔드포인트 목록
const PUBLIC_ENDPOINTS = [
    API_ENDPOINTS.AUTH_SIGNIN,
    API_ENDPOINTS.AUTH_SIGNUP,
    API_ENDPOINTS.AUTH_REFRESH,
    API_ENDPOINTS.AUTH_SEND_VERIFICATION_CODE,
    API_ENDPOINTS.AUTH_VERIFY_EMAIL,
];

// Generic fetch wrapper with token handling
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth = false
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(e => endpoint.startsWith(e));

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    // 인증이 필요한 엔드포인트에 액세스 토큰 추가
    if (!skipAuth && !isPublicEndpoint) {
        const accessToken = tokenService.getAccessToken();
        console.log(`[API Request] Endpoint: ${endpoint}, AccessToken exists: ${!!accessToken}`);
        if (accessToken) {
            (defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
            console.log(`[API Request] Authorization header added for ${endpoint}`);
        } else {
            console.warn(`[API Request] No access token found for ${endpoint}`);
        }
    }

    console.log(`[API Request] Making request to ${url} with headers:`, defaultHeaders);

    let response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });

    // 401 에러 시 토큰 갱신 후 재시도 (public 엔드포인트 제외)
    if (response.status === 401 && !isPublicEndpoint && !skipAuth) {
        console.log('[API] 401 received, attempting token refresh...');

        const newAccessToken = await tokenService.refreshAccessToken();

        if (newAccessToken) {
            // 새 토큰으로 재시도
            console.log('[API] Retrying request with new token...');
            response = await fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers,
                    'Authorization': `Bearer ${newAccessToken}`,
                },
            });
        } else {
            // 토큰 갱신 실패 - 로그인 페이지로 이동
            console.log('[API] Token refresh failed, redirecting to login...');
            window.location.hash = '#/signin';
            throw new ApiError('세션이 만료되었습니다. 다시 로그인해주세요.', false, 401);
        }
    }

    let rawResult: unknown;

    try {
        rawResult = await response.json();
        console.log('[API Response]', { endpoint, status: response.status, body: JSON.stringify(rawResult, null, 2) });
    } catch {
        // JSON 파싱 실패 시
        throw new ApiError(
            `서버 오류가 발생했습니다. (${response.status})`,
            false,
            response.status
        );
    }

    const result = rawResult as ApiResponse<T>;

    // HTTP 에러 또는 success: false인 경우
    if (!response.ok || !result.success) {
        // 서버 에러 응답 형식 처리 (Spring Boot 기본 에러 형식 지원)
        const errorBody = rawResult as {
            message?: string;
            error?: string;
            errors?: Array<{ defaultMessage?: string; field?: string }>;
            // Spring Boot validation 에러 형식
            fieldErrors?: Record<string, string>;
        };

        let errorMessage = '요청에 실패했습니다.';

        if (result.message && result.message.trim()) {
            errorMessage = result.message;
        } else if (errorBody.message && errorBody.message.trim()) {
            errorMessage = errorBody.message;
        } else if (errorBody.errors && errorBody.errors.length > 0) {
            // Validation 에러 - 첫 번째 에러 메시지 사용
            const firstError = errorBody.errors[0];
            errorMessage = firstError.field
                ? `${firstError.field}: ${firstError.defaultMessage}`
                : firstError.defaultMessage || errorMessage;
        } else if (errorBody.fieldErrors) {
            // fieldErrors 형식
            const firstField = Object.keys(errorBody.fieldErrors)[0];
            if (firstField) {
                errorMessage = `${firstField}: ${errorBody.fieldErrors[firstField]}`;
            }
        } else {
            // 상태 코드별 기본 메시지
            switch (response.status) {
                case 400:
                    errorMessage = '입력 정보를 확인해주세요.';
                    break;
                case 401:
                    errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
                    break;
                case 403:
                    errorMessage = '접근 권한이 없습니다.';
                    break;
                case 404:
                    errorMessage = '요청한 리소스를 찾을 수 없습니다.';
                    break;
                case 409:
                    errorMessage = '이미 존재하는 정보입니다.';
                    break;
                case 500:
                    errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                    break;
                default:
                    errorMessage = errorBody.error || `요청에 실패했습니다. (${response.status})`;
            }
        }

        console.error('[API Error]', {
            endpoint,
            status: response.status,
            rawResult: JSON.stringify(rawResult, null, 2)
        });

        throw new ApiError(errorMessage, false, response.status);
    }

    return result.data;
}

// ============ Auth APIs ============

// 로그인
export const signin = async ({
    usernameOrEmail,
    password
}: SignInRequest): Promise<AuthResponse> => {
    const requestBody = { usernameOrEmail, password };
    console.log('[Signin API] Request body:', JSON.stringify(requestBody));

    const response = await apiRequest<AuthResponse>(API_ENDPOINTS.AUTH_SIGNIN, {
        method: 'POST',
        body: JSON.stringify(requestBody),
    });

    // 로그인 성공 시 토큰 저장
    await tokenService.setTokensOnLogin(response.accessToken, response.refreshToken);

    return response;
};

// 회원가입
export const signup = async (data: SignUpRequest): Promise<SignUpResponse> => {
    return apiRequest<SignUpResponse>(API_ENDPOINTS.AUTH_SIGNUP, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

// 이메일 인증 코드 전송
export const sendVerificationCode = async ({ email }: SendVerificationCodeRequest): Promise<void> => {
    return apiRequest<void>(API_ENDPOINTS.AUTH_SEND_VERIFICATION_CODE, {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
};

// 이메일 인증
export const verifyEmail = async ({ email, code }: VerifyEmailRequest): Promise<boolean> => {
    return apiRequest<boolean>(API_ENDPOINTS.AUTH_VERIFY_EMAIL, {
        method: 'POST',
        body: JSON.stringify({ email, code }),
    });
};

// 로그아웃
export const signout = async (): Promise<void> => {
    try {
        await apiRequest<void>(API_ENDPOINTS.AUTH_SIGNOUT, {
            method: 'POST',
        });
    } finally {
        // API 호출 성공/실패와 관계없이 로컬 토큰 삭제
        await tokenService.clearTokens();
    }
};

// 자동 로그인 시도
export const tryAutoLogin = async (): Promise<boolean> => {
    return tokenService.tryAutoLogin();
};

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
    return tokenService.isAuthenticated();
};

// 토큰 서비스 export (필요한 경우 직접 접근용)
export { tokenService };

// ============ User APIs ============

export interface UserInfo {
    id: string;
    username: string;
    email: string;
    name: string;
    avatarId: string;
    createdAt: string;
    updatedAt: string;
}

// 현재 사용자 정보 조회
export const getCurrentUser = async (): Promise<UserInfo> => {
    return apiRequest<UserInfo>(API_ENDPOINTS.USER_ME, {
        method: 'GET',
    });
};

// 프로필 수정
export interface UpdateProfileRequest {
    name: string;
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<UserInfo> => {
    return apiRequest<UserInfo>(API_ENDPOINTS.USER_PROFILE, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const fetchContributionData = async (year: number): Promise<number[][]> => {
    // Simulate API call for dashboard data
    return new Promise((resolve) => {
        setTimeout(() => {
            const data: number[][] = [];

            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);

            // 0 = Sunday, 1 = Monday, ...
            const startDay = startDate.getDay();

            // Days in the year
            const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            const totalDays = isLeap ? 366 : 365;

            let currentWeek: number[] = [];

            // Pad initial week
            for (let i = 0; i < startDay; i++) {
                currentWeek.push(-1); // -1 indicates no day (empty cell)
            }

            for (let i = 1; i <= totalDays; i++) {
                const rand = Math.random();
                let level = 0;
                // Weighted random for realistic "activity"
                if (rand > 0.85) level = 1;         // Low
                else if (rand > 0.92) level = 2;    // Medium
                else if (rand > 0.96) level = 3;    // High
                else if (rand > 0.99) level = 4;    // Very High
                else if (rand > 0.6) level = 0;     // None (often 0)

                currentWeek.push(level);

                if (currentWeek.length === 7) {
                    data.push(currentWeek);
                    currentWeek = [];
                }
            }

            // Pad final week if not complete
            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) {
                    currentWeek.push(-1);
                }
                data.push(currentWeek);
            }

            resolve(data);
        }, 300); // reduced latency
    });
};

// ============ Analysis APIs ============

interface RadarStat {
    label: string;
    value: number;
}

export interface DashboardStatsResponse {
    radarData: RadarStat[];
    currentStreak: number;
    completedDays: number;
    totalDays: number;
    completedItems: number;
    contributionData: number[][];
}

// 대시보드 통계 조회 (레이더 데이터만)
export const fetchDashboardStats = async (): Promise<RadarStat[]> => {
    const response = await apiRequest<DashboardStatsResponse>(API_ENDPOINTS.ANALYSIS_STATS, {
        method: 'GET',
    });
    return response.radarData;
};

// 대시보드 전체 통계 조회 (스트릭, 컨트리뷰션 포함)
export const fetchDashboardFullStats = async (year?: number): Promise<DashboardStatsResponse> => {
    const url = year ? `${API_ENDPOINTS.ANALYSIS_STATS}?year=${year}` : API_ENDPOINTS.ANALYSIS_STATS;
    const response = await apiRequest<DashboardStatsResponse>(url, {
        method: 'GET',
    });
    return response;
};
