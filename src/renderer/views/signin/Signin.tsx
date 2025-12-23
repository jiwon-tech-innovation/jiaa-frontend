import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { signin } from '../../services/api';
import './signin.css';

const Signin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useAppDispatch();

    const signinMutation = useMutation({
        mutationFn: signin,
        onSuccess: async (data) => {
            dispatch(setCredentials({ accessToken: data.accessToken, email: data.email }));
            // Save refresh token to safeStorage via IPC
            await window.electronAPI.saveRefreshToken(data.refreshToken);
            // Notify Main process to switch views
            window.electronAPI.signinSuccess(data.email);
        },
        onError: (error) => {
            console.error('Signin failed:', error);
            alert('Signin failed. Please try again.');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            console.log('Signin attempt:', { email, password: '***' });
            signinMutation.mutate({ email, password });
        } else {
            alert('Please fill in all fields');
        }
    };

    const handleSignup = () => {
        window.electronAPI?.openSignup();
    };

    return (
        <div className="signin-container">
            <h1>로그인</h1>
            <form id="signin-form" onSubmit={handleSubmit} noValidate>
                <div className="input-group">
                    <input
                        type="email"
                        id="email"
                        required
                        autoComplete="off"
                        placeholder=" "
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <label htmlFor="email">아이디</label>
                </div>
                <div className="input-group">
                    <input
                        type="password"
                        id="password"
                        required
                        placeholder=" "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <label htmlFor="password">비밀번호</label>
                </div>
                <button type="submit" className="signin-btn">로그인</button>
            </form>
            <div className="footer">
                <a id="signup-link" onClick={handleSignup} style={{ cursor: 'pointer' }}>회원이 아니신가요?</a>
            </div>
        </div>
    );
};

export default Signin;
