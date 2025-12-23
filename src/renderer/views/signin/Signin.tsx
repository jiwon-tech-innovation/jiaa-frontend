import React, { useState } from 'react';
import './login.css';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            console.log('Login attempt:', { email, password: '***' });
            window.electronAPI?.loginSuccess(email);
        } else {
            alert('Please fill in all fields');
        }
    };

    const handleSignup = () => {
        window.electronAPI?.openSignup();
    };

    return (
        <div className="login-container">
            <h1>로그인</h1>
            <form id="login-form" onSubmit={handleSubmit} noValidate>
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
                <button type="submit" className="login-btn">로그인</button>
            </form>
            <div className="footer">
                <a id="signup-link" onClick={handleSignup} style={{ cursor: 'pointer' }}>회원이 아니신가요?</a>
            </div>
        </div>
    );
};

export default Login;
