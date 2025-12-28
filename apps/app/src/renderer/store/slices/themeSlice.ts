import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
}

const THEME_STORAGE_KEY = 'jiaa-theme-preference';

const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') {
        return 'dark';
    }

    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
    } catch (error) {
        console.error('Failed to load theme from localStorage:', error);
    }
    return 'dark'; // 기본값
};

const initialState: ThemeState = {
    theme: getInitialTheme(),
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<Theme>) => {
            state.theme = action.payload;
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(THEME_STORAGE_KEY, action.payload);
                } catch (error) {
                    console.error('Failed to save theme to localStorage:', error);
                }
            }
        },
    },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
