// Token Service - 토큰 관리 서비스

import { AUTH_REFRESH_URL } from '../../common/constants';

type TokenChangeCallback = (accessToken: string | null) => void;

class TokenService {
    private accessToken: string | null = null;
    private isRefreshing = false;
    private refreshSubscribers: Array<(token: string | null) => void> = [];
    private tokenChangeCallbacks: TokenChangeCallback[] = [];

    // 액세스 토큰 getter
    getAccessToken(): string | null {
        return this.accessToken;
    }

    // 액세스 토큰 setter
    setAccessToken(token: string | null): void {
        this.accessToken = token;
        this.notifyTokenChange(token);
    }

    // 토큰 변경 리스너 등록
    onTokenChange(callback: TokenChangeCallback): () => void {
        this.tokenChangeCallbacks.push(callback);
        return () => {
            this.tokenChangeCallbacks = this.tokenChangeCallbacks.filter(cb => cb !== callback);
        };
    }

    // 토큰 변경 알림
    private notifyTokenChange(token: string | null): void {
        this.tokenChangeCallbacks.forEach(cb => cb(token));
    }

    // 리프레시 토큰으로 새 액세스 토큰 발급
    async refreshAccessToken(): Promise<string | null> {
        // 이미 갱신 중이면 대기
        if (this.isRefreshing) {
            return new Promise((resolve) => {
                this.refreshSubscribers.push(resolve);
            });
        }

        this.isRefreshing = true;

        try {
            // 저장된 리프레시 토큰 가져오기
            const refreshToken = await electronAPI.getRefreshToken();

            if (!refreshToken) {
                console.log('[TokenService] No refresh token found');
                this.setAccessToken(null);
                return null;
            }

            console.log('[TokenService] Refreshing access token...');

            // 리프레시 API 직접 호출 (apiRequest 사용하면 무한 루프 가능)
            const response = await fetch(AUTH_REFRESH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                console.error('[TokenService] Token refresh failed:', response.status);
                // 리프레시 토큰도 만료됨 - 로그아웃 처리
                await this.clearTokens();
                return null;
            }

            const result = await response.json();

            if (!result.success || !result.data) {
                console.error('[TokenService] Invalid refresh response');
                await this.clearTokens();
                return null;
            }

            const { accessToken, refreshToken: newRefreshToken, email } = result.data;

            // 새 토큰 저장
            this.setAccessToken(accessToken);

            // 새 리프레시 토큰이 있으면 저장 (토큰 로테이션)
            if (newRefreshToken) {
                await electronAPI.saveRefreshToken(newRefreshToken);
            }

            console.log('[TokenService] Token refreshed successfully');

            // 대기 중인 요청들에게 새 토큰 전달
            this.refreshSubscribers.forEach(callback => callback(accessToken));
            this.refreshSubscribers = [];

            return accessToken;
        } catch (error) {
            console.error('[TokenService] Token refresh error:', error);
            await this.clearTokens();
            return null;
        } finally {
            this.isRefreshing = false;
        }
    }

    // 모든 토큰 삭제 (로그아웃)
    async clearTokens(): Promise<void> {
        this.setAccessToken(null);
        await electronAPI.deleteRefreshToken();
        console.log('[TokenService] All tokens cleared');
    }

    // 앱 시작 시 저장된 토큰으로 자동 로그인 시도
    async tryAutoLogin(): Promise<boolean> {
        try {
            const refreshToken = await electronAPI.getRefreshToken();

            if (!refreshToken) {
                console.log('[TokenService] No stored refresh token for auto-login');
                return false;
            }

            const accessToken = await this.refreshAccessToken();
            return accessToken !== null;
        } catch (error) {
            console.error('[TokenService] Auto-login failed:', error);
            return false;
        }
    }

    // 로그인 성공 시 토큰 설정
    async setTokensOnLogin(accessToken: string, refreshToken: string): Promise<void> {
        this.setAccessToken(accessToken);
        await electronAPI.saveRefreshToken(refreshToken);
        console.log('[TokenService] Tokens saved on login');
    }

    // 인증 여부 확인
    isAuthenticated(): boolean {
        return this.accessToken !== null;
    }
}

// 싱글톤 인스턴스
export const tokenService = new TokenService();

