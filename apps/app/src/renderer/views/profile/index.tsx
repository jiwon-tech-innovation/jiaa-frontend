import React from 'react';
import { createRoot } from 'react-dom/client';
import ProfileView from './ProfileView';
import '../../styles/global.css';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from '../../store';
import { queryClient } from '../../lib/queryClient';

console.log('[Profile] Mounting React app');
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <ProfileView />
            </QueryClientProvider>
        </Provider>
    </React.StrictMode>
);
