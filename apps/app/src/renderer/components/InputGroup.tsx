
import React from 'react';

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string; // id is required for label association
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, id, className = '', ...props }) => {
    return (
        <div className={`input-group ${className}`}>
            <input
                id={id}
                placeholder=" "
                className="form-input"
                {...props} 
            />
            <label htmlFor={id} className="form-label">{label}</label>
        </div>
    );
};
