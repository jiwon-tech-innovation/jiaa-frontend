import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from '../../store';
import { queryClient } from '../../lib/queryClient';
import '../../styles/global.css';
import AvatarSetting from './Avatar_setting';


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <AvatarSetting />
            </QueryClientProvider>
        </Provider>
    </React.StrictMode>
);
