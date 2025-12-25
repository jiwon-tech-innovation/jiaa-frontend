import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { InputGroup } from '@repo/ui';
import { signup, sendVerificationCode, verifyEmail, ApiError } from '../../services/api';
import './signup.css';

// 1: 이메일 입력 → 2: 인증 코드 확인 → 3: 회원 정보 입력
type SignupStep = 'email' | 'verify' | 'form';

const Signup: React.FC = () => {
    const [step, setStep] = useState<SignupStep>('email');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // 이메일 인증 코드 전송
    const sendCodeMutation = useMutation({
        mutationFn: sendVerificationCode,
        onSuccess: () => {
            setSuccessMessage('인증 코드가 이메일로 전송되었습니다.');
            setErrorMessage('');
            setStep('verify');
        },
        onError: (error: Error) => {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('인증 코드 전송에 실패했습니다.');
            }
        }
    });

    // 이메일 인증 확인
    const verifyEmailMutation = useMutation({
        mutationFn: verifyEmail,
        onSuccess: () => {
            setSuccessMessage('이메일 인증이 완료되었습니다. 회원 정보를 입력해주세요.');
            setErrorMessage('');
            setStep('form');
        },
        onError: (error: Error) => {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('인증 코드가 올바르지 않습니다.');
            }
        }
    });

    // 회원가입
    const signupMutation = useMutation({
        mutationFn: signup,
        onSuccess: (data) => {
            console.log('Signup success:', data);
            setSuccessMessage('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
            setErrorMessage('');
            setTimeout(() => {
                window.electronAPI?.openSignin();
            }, 1500);
        },
        onError: (error: Error) => {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('회원가입에 실패했습니다. 다시 시도해주세요.');
            }
        }
    });

    // 비밀번호 유효성 검사 (최소 8자, 대소문자, 숫자, 특수문자 포함)
    const validatePassword = (pwd: string): boolean => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        return regex.test(pwd);
    };

    // Step 1: 이메일 입력 후 인증 코드 전송
    const handleSendCode = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!email) {
            setErrorMessage('이메일을 입력해주세요.');
            return;
        }

        sendCodeMutation.mutate({ email });
    };

    // Step 2: 인증 코드 확인
    const handleVerifyCode = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!verificationCode || verificationCode.length !== 6) {
            setErrorMessage('6자리 인증 코드를 입력해주세요.');
            return;
        }

        verifyEmailMutation.mutate({ email, code: verificationCode });
    };

    // Step 3: 회원가입 정보 제출
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!username || !name || !password || !confirmPassword) {
            setErrorMessage('모든 필드를 입력해주세요.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!validatePassword(password)) {
            setErrorMessage('비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.');
            return;
        }

        signupMutation.mutate({ username, email, password, name });
    };

    const handleResendCode = () => {
        setErrorMessage('');
        setSuccessMessage('');
        sendCodeMutation.mutate({ email });
    };

    const handleBackToSignin = () => {
        window.electronAPI?.openSignin();
    };

    const handleBackToEmail = () => {
        setStep('email');
        setVerificationCode('');
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleBackToVerify = () => {
        setStep('verify');
        setErrorMessage('');
        setSuccessMessage('');
    };

    const isLoading = sendCodeMutation.isPending || verifyEmailMutation.isPending || signupMutation.isPending;

    return (
        <div className="auth-wrapper">
            <div className="signup-container">
                <h1>회원가입</h1>

                {/* Step 1: 이메일 입력 */}
                {step === 'email' && (
                    <form id="email-form" onSubmit={handleSendCode} noValidate>
                        <p className="step-info">이메일 인증을 진행해주세요.</p>
                        <InputGroup
                            label="이메일"
                            id="email"
                            type="email"
                            required
                            autoComplete="off"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {errorMessage && (
                            <div className="error-message">{errorMessage}</div>
                        )}
                        {successMessage && (
                            <div className="success-message">{successMessage}</div>
                        )}
                        <button 
                            type="submit" 
                            className="signup-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? '전송 중...' : '인증 코드 전송'}
                        </button>
                    </form>
                )}

                {/* Step 2: 인증 코드 확인 */}
                {step === 'verify' && (
                    <form id="verify-form" onSubmit={handleVerifyCode} noValidate>
                        <p className="verify-info">
                            <strong>{email}</strong>로 전송된 6자리 인증 코드를 입력해주세요.
                        </p>
                        <InputGroup
                            label="인증 코드"
                            id="verification-code"
                            type="text"
                            required
                            autoComplete="off"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                        />
                        {errorMessage && (
                            <div className="error-message">{errorMessage}</div>
                        )}
                        {successMessage && (
                            <div className="success-message">{successMessage}</div>
                        )}
                        <button 
                            type="submit" 
                            className="signup-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? '확인 중...' : '인증 확인'}
                        </button>
                        <div className="verify-actions">
                            <button 
                                type="button" 
                                className="link-btn"
                                onClick={handleResendCode}
                                disabled={isLoading}
                            >
                                인증 코드 재전송
                            </button>
                            <button 
                                type="button" 
                                className="link-btn"
                                onClick={handleBackToEmail}
                                disabled={isLoading}
                            >
                                이메일 변경
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: 회원 정보 입력 */}
                {step === 'form' && (
                    <form id="signup-form" onSubmit={handleSubmit} noValidate>
                        <p className="step-info">
                            <strong>{email}</strong> 인증 완료! 회원 정보를 입력해주세요.
                        </p>
                        <InputGroup
                            label="아이디"
                            id="username"
                            type="text"
                            required
                            autoComplete="off"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <InputGroup
                            label="이름"
                            id="name"
                            type="text"
                            required
                            autoComplete="off"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <InputGroup
                            label="비밀번호"
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <p className="password-hint">
                            8자 이상, 대문자, 소문자, 숫자, 특수문자 포함
                        </p>
                        <InputGroup
                            label="비밀번호 확인"
                            id="confirm-password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {errorMessage && (
                            <div className="error-message">{errorMessage}</div>
                        )}
                        {successMessage && (
                            <div className="success-message">{successMessage}</div>
                        )}
                        <button 
                            type="submit" 
                            className="signup-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? '가입 중...' : '회원가입'}
                        </button>
                        <div className="verify-actions">
                            <button 
                                type="button" 
                                className="link-btn"
                                onClick={handleBackToVerify}
                                disabled={isLoading}
                            >
                                이전으로
                            </button>
                        </div>
                    </form>
                )}

                <div className="footer">
                    <a id="back-to-signin" onClick={handleBackToSignin} style={{ cursor: 'pointer' }}>이미 회원이신가요?</a>
                </div>
            </div>
        </div>
    );
};

export default Signup;
