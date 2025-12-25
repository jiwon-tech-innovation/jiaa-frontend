'use client';

import React, { useRef, useEffect, useState } from 'react';
import './Dropdown.css';

export interface DropdownOption<T extends string = string> {
    value: T;
    label: string;
}

export interface DropdownProps<T extends string = string> {
    options: DropdownOption<T>[];
    value: T;
    onChange: (value: T) => void;
    renderTrigger: (currentLabel: string) => React.ReactNode;
    className?: string;
}

export function Dropdown<T extends string = string>({
    options,
    value,
    onChange,
    renderTrigger,
    className = ''
}: DropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentOption = options.find(o => o.value === value);
    const currentLabel = currentOption?.label || '';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: T) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`dropdown-wrapper ${className}`} ref={dropdownRef}>
            <div className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
                {renderTrigger(currentLabel)}
            </div>
            <button
                className="dropdown-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle dropdown"
            >
                ▼
            </button>
            {isOpen && (
                <div className="dropdown-menu">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            className={`dropdown-item ${value === option.value ? 'active' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
