import React, { useState } from 'react';
import { InputGroup } from '@repo/ui';
import './signup.css';

const Signup: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (email && password) {
            console.log('Signup attempt:', { email });
            // For now, just simulate success and go back to signin or auto-signin
            alert('Account created! Please signin.');
            window.electronAPI?.openSignin();
        } else {
            alert('Please fill in all fields');
        }
    };

    const handleBackToSignin = () => {
        window.electronAPI?.openSignin();
    };

    return (
        <div className="auth-wrapper">
            <div className="signup-container">
                <h1>회원가입</h1>
                <form id="signup-form" onSubmit={handleSubmit} noValidate>
                    <InputGroup
                        label="이메일"
                        id="email"
                        type="email"
                        required
                        autoComplete="off"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <InputGroup
                        label="비밀번호"
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <InputGroup
                        label="비밀번호 확인"
                        id="confirm-password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="submit" className="signup-btn">회원가입</button>
                </form>
                <div className="footer">
                    <a id="back-to-signin" onClick={handleBackToSignin} style={{ cursor: 'pointer' }}>이미 회원이신가요?</a>
                </div>
            </div>
        </div>
    );
};

export default Signup;
