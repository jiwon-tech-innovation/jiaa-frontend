export const MODEL_NAME = 'Hiyori';

// API 기본 URL (모든 서비스는 Gateway를 통해 접근)
export const API_BASE_URL = 'http://localhost:8080';

// AI Chat 서비스 엔드포인트
export const CHAT_WS_URL = `${API_BASE_URL.replace('http://', 'ws://')}/api/chat/ws`; // WebSocket URL
export const CHAT_API_URL = `${API_BASE_URL}/api/chat`; // HTTP API URL (WebSocket 실패 시 fallback)

// 백엔드 API 엔드포인트 경로
export const API_ENDPOINTS = {
  // Auth
  AUTH_SIGNIN: '/api/auth/signin',
  AUTH_SIGNUP: '/api/auth/signup',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_SIGNOUT: '/api/auth/signout',
  AUTH_SEND_VERIFICATION_CODE: '/api/auth/send-verification-code',
  AUTH_VERIFY_EMAIL: '/api/auth/verify-email',
  // User
  USER_ME: '/api/users/me',
  USER_PROFILE: '/api/users/me/profile',
  USER_AVATARS: '/api/users/avatars',
  USER_PERSONALITIES: '/api/users/personalities',
  USER_UPDATE_AVATAR: '/api/users/me/avatar',
  USER_UPDATE_PERSONALITY: '/api/users/me/personality',
  // Analysis
  ANALYSIS_STATS: '/api/analysis/stats',
} as const;

// 백엔드 API 전체 URL
export const AUTH_REFRESH_URL = `${API_BASE_URL}${API_ENDPOINTS.AUTH_REFRESH}`;

// AI Chat 서비스 엔드포인트 경로
export const AI_CHAT_ENDPOINTS = {
  ROADMAPS: '/api/roadmaps',
  ROADMAP_START: '/roadmap/start', // CHAT_API_URL과 결합하여 /api/chat/roadmap/start가 됨
  STATS: '/api/roadmaps/stats', // 활동 통계 엔드포인트 (경로 확인 필요)
} as const;

// CSP 정책용 URL 문자열 생성
export const getCSPConnectSrc = (): string => {
  return `'self' local-model: ${API_BASE_URL} ${API_BASE_URL.replace('http://', 'ws://')}`;
};
