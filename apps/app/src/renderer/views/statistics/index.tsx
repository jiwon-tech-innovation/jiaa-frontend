import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { Statistics } from './Statistics';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <Provider store={store}>
                <QueryClientProvider client={queryClient}>
                    <Statistics />
                </QueryClientProvider>
            </Provider>
        </React.StrictMode>
    );
}
