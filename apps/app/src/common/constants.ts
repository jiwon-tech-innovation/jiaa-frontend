export const MODEL_NAME = 'Hiyori';

// API 기본 URL
export const API_BASE_URL = 'http://localhost:8080'; // Spring Boot 백엔드 서비스
export const AI_CHAT_API_BASE_URL = 'http://localhost:8000'; // FastAPI AI Chat 서비스

// AI Chat 서비스 엔드포인트
export const CHAT_WS_URL = `${AI_CHAT_API_BASE_URL.replace('http://', 'ws://')}/ws/chat`; // WebSocket URL
export const CHAT_API_URL = `${AI_CHAT_API_BASE_URL}/chat`; // HTTP API URL (WebSocket 실패 시 fallback)

// 백엔드 API 엔드포인트 경로
export const API_ENDPOINTS = {
  // Auth
  AUTH_SIGNIN: '/api/v1/auth/signin',
  AUTH_SIGNUP: '/api/v1/auth/signup',
  AUTH_REFRESH: '/api/v1/auth/refresh',
  AUTH_SIGNOUT: '/api/v1/auth/signout',
  AUTH_SEND_VERIFICATION_CODE: '/api/v1/auth/send-verification-code',
  AUTH_VERIFY_EMAIL: '/api/v1/auth/verify-email',
  // User
  USER_ME: '/api/v1/users/me',
  USER_PROFILE: '/api/v1/users/me/profile',
  // Analysis
  ANALYSIS_STATS: '/api/analysis/stats',
} as const;

// 백엔드 API 전체 URL
export const AUTH_REFRESH_URL = `${API_BASE_URL}${API_ENDPOINTS.AUTH_REFRESH}`;

// AI Chat 서비스 엔드포인트 경로
export const AI_CHAT_ENDPOINTS = {
  ROADMAPS: '/roadmaps',
  ROADMAP_START: '/chat/roadmap/start',
  STATS: '/stats',
} as const;

// CSP 정책용 URL 문자열 생성
export const getCSPConnectSrc = (): string => {
  return `'self' local-model: ${API_BASE_URL} ${AI_CHAT_API_BASE_URL.replace('http://', 'ws://')} ${AI_CHAT_API_BASE_URL}`;
};
