import React, { useRef, useEffect } from 'react';
import './Sidebar.css';

export interface SidebarItem {
    id: string;
    icon: string;
    label: string;
    active?: boolean;
    onClick?: () => void;
}

export interface SidebarProps {
    items: SidebarItem[];
    isProfileDropdownOpen: boolean;
    isProfileActive?: boolean;
    onProfileClick: () => void;
    onSignout: () => void;
    onProfileDetail?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    items,
    isProfileDropdownOpen,
    isProfileActive,
    onProfileClick,
    onSignout,
    onProfileDetail,
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                if (isProfileDropdownOpen) {
                    onProfileClick();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileDropdownOpen, onProfileClick]);

    return (
        <nav className="sidebar">
            <div
                className={`nav-item profile ${isProfileActive ? 'active' : ''}`}
                onClick={onProfileClick}
                ref={dropdownRef}
            >
                <div className="profile-circle"></div>
                {isProfileDropdownOpen && (
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={onProfileDetail}>
                            내 프로필
                        </div>
                        <div className="dropdown-item" onClick={onSignout}>
                            로그아웃
                        </div>
                    </div>
                )}
            </div>
            <div className="nav-group">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`nav-item ${item.active ? 'active' : ''}`}
                        onClick={item.onClick}
                        title={item.label}
                    >
                        <img src={item.icon} alt={item.label} />
                    </div>
                ))}
            </div>
        </nav>
    );
};

