import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from '../../store';
import { queryClient } from '../../lib/queryClient';
import Avatar from './Avatar';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <Avatar />
            </QueryClientProvider>
        </Provider>
    </React.StrictMode>
);
