import React from 'react';
import './InputGroup.css';

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, id, className = '', type, onChange, ...props }) => {
    const isPassword = type === 'password';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isPassword) {
            // 비밀번호 필드에서 ASCII 문자만 허용 (한글 입력 방지)
            const filteredValue = e.target.value.replace(/[^\x00-\x7F]/g, '');
            e.target.value = filteredValue;
        }
        onChange?.(e);
    };

    return (
        <div className={`input-group ${className}`}>
            <input
                id={id}
                placeholder=" "
                className="form-input"
                type={type}
                onChange={handleChange}
                {...(isPassword && { inputMode: 'latin' as const, autoComplete: 'off' })}
                {...props}
            />
            <label htmlFor={id} className="form-label">{label}</label>
        </div>
    );
};
