import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import type { Theme } from '../store/slices/themeSlice';

export const useTheme = () => {
    const theme = useAppSelector((state) => state.theme.theme);

    useEffect(() => {
        if (typeof window === 'undefined' || !document.documentElement) {
            return;
        }

        const applyTheme = (selectedTheme: Theme) => {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            let resolvedTheme: 'light' | 'dark' = 'dark';

            if (selectedTheme === 'system') {
                resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
            } else {
                resolvedTheme = selectedTheme;
            }

            document.documentElement.setAttribute('data-theme', resolvedTheme);
        };

        applyTheme(theme);

        // 시스템 테마 변경 감지 (system 모드일 때만)
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme(theme);

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);
};
