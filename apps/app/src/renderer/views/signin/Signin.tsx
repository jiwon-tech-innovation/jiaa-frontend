import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { signin, tryAutoLogin, tokenService, ApiError } from '../../services/api';
import { InputGroup } from '@repo/ui';
import './signin.css';

const Signin: React.FC = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isAutoLogging, setIsAutoLogging] = useState(true);
    const dispatch = useAppDispatch();

    // 앱 시작 시 자동 로그인 시도
    useEffect(() => {
        const attemptAutoLogin = async () => {
            console.log('[Signin] Attempting auto-login...');
            try {
                const success = await tryAutoLogin();
                if (success) {
                    console.log('[Signin] Auto-login successful');
                    // 토큰이 갱신되었으므로 대시보드로 이동
                    // 이메일 정보는 서버에서 받아와야 하지만, 일단 빈 값으로 처리
                    window.electronAPI.signinSuccess('');
                } else {
                    console.log('[Signin] Auto-login failed, showing login form');
                }
            } catch (error) {
                console.error('[Signin] Auto-login error:', error);
            } finally {
                setIsAutoLogging(false);
            }
        };

        attemptAutoLogin();
    }, []);

    const signinMutation = useMutation({
        mutationFn: signin,
        onSuccess: async (data) => {
            console.log('[Signin] Success:', data.email);
            setErrorMessage('');
            // 토큰은 api.ts의 signin 함수에서 자동으로 저장됨
            dispatch(setCredentials({ accessToken: data.accessToken, email: data.email }));
            console.log('[Signin] Calling signinSuccess IPC');
            // Notify Main process to switch views
            window.electronAPI.signinSuccess(data.email);
        },
        onError: (error: Error) => {
            console.error('Signin failed:', error);
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('로그인에 실패했습니다. 다시 시도해주세요.');
            }
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        if (usernameOrEmail && password) {
            console.log('Signin attempt:', { usernameOrEmail, password: '***' });
            signinMutation.mutate({ usernameOrEmail, password });
        } else {
            setErrorMessage('모든 필드를 입력해주세요.');
        }
    };

    const handleSignup = () => {
        window.electronAPI?.openSignup();
    };

    // 자동 로그인 시도 중일 때 로딩 표시
    if (isAutoLogging) {
        return (
            <div className="auth-wrapper">
                <div className="signin-container">
                    <h1>로그인 중...</h1>
                    <p style={{ textAlign: 'center', color: '#666' }}>자동 로그인을 시도하고 있습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-wrapper">
            <div className="signin-container">
                <h1>로그인</h1>
                <form id="signin-form" onSubmit={handleSubmit} noValidate>
                    <InputGroup
                        label="아이디 또는 이메일"
                        id="usernameOrEmail"
                        type="text"
                        required
                        autoComplete="off"
                        value={usernameOrEmail}
                        onChange={(e) => setUsernameOrEmail(e.target.value)}
                    />
                    <InputGroup
                        label="비밀번호"
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {errorMessage && (
                        <div className="error-message">{errorMessage}</div>
                    )}
                    <button 
                        type="submit" 
                        className="signin-btn"
                        disabled={signinMutation.isPending}
                    >
                        {signinMutation.isPending ? '로그인 중...' : '로그인'}
                    </button>
                </form>
                <div className="footer">
                    <a id="signup-link" onClick={handleSignup} style={{ cursor: 'pointer' }}>회원이 아니신가요?</a>
                </div>
            </div>
        </div>
    );
};

export default Signin;
