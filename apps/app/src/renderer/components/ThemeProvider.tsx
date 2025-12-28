import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    useTheme();
    return <>{children}</>;
};
