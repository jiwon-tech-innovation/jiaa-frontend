import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
    root: 'src/renderer',
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                avatar: resolve(__dirname, 'src/renderer/views/avatar/index.html'),
                signin: resolve(__dirname, 'src/renderer/views/signin/signin.html'),
                signup: resolve(__dirname, 'src/renderer/views/signup/signup.html'),
                dashboard: resolve(__dirname, 'src/renderer/views/dashboard/dashboard.html'),
            },
        },
    },
    publicDir: '../../public',
});
