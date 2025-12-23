
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    accessToken: string | null;
    user: {
        email: string;
    } | null;
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
        signout: (state) => {
            state.accessToken = null;
            state.user = null;
            state.isSignedIn = false;
        },
    },
});

export const { setCredentials, signout } = authSlice.actions;

export default authSlice.reducer;
