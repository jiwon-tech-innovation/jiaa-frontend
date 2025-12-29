
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
    email: string;
    name?: string;
    id?: string;
    username?: string;
    avatarId?: string;
}

interface AuthState {
    accessToken: string | null;
    user: User | null;
    isSignedIn: boolean;
}

const initialState: AuthState = {
    accessToken: null,
    user: null,
    isSignedIn: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ accessToken: string; email: string }>
        ) => {
            const { accessToken, email } = action.payload;
            state.accessToken = accessToken;
            state.user = { email };
            state.isSignedIn = true;
        },
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        signout: (state) => {
            state.accessToken = null;
            state.user = null;
            state.isSignedIn = false;
        },
    },
});

export const { setCredentials, updateUser, signout } = authSlice.actions;

export default authSlice.reducer;
