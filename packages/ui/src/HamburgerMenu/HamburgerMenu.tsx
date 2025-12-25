import React, { useState } from 'react';
import './HamburgerMenu.css';

export interface HamburgerMenuProps {
    children: React.ReactNode;
    className?: string;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ children, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        // Prevent scrolling when menu is open
        if (!isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    };

    return (
        <div className={`hamburger-menu ${className}`}>
            <button
                className={`hamburger-button ${isOpen ? 'open' : ''}`}
                onClick={toggleMenu}
                aria-label="Menu"
            >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
            </button>

            <div className={`hamburger-overlay ${isOpen ? 'open' : ''}`}>
                <div className="hamburger-content">
                    {children}
                </div>
            </div>
        </div>
    );
};
