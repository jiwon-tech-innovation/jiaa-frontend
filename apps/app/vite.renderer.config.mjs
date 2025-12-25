import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
    root: 'src/renderer',
    base: './',
    plugins: [react()],
    build: {
        outDir: '../../.vite/renderer/main_window',
        rollupOptions: {
            input: {
                avatar: resolve(__dirname, 'src/renderer/views/avatar/index.html'),
                signin: resolve(__dirname, 'src/renderer/views/signin/signin.html'),
                signup: resolve(__dirname, 'src/renderer/views/signup/signup.html'),
                dashboard: resolve(__dirname, 'src/renderer/views/dashboard/dashboard.html'),
                roadmap: resolve(__dirname, 'src/renderer/views/roadmap/roadmap.html'),
                social: resolve(__dirname, 'src/renderer/views/social/social.html'),
                setting: resolve(__dirname, 'src/renderer/views/setting/setting.html'),
                profile: resolve(__dirname, 'src/renderer/views/profile/profile.html'),
            },
        },
    },
    publicDir: '../../public',
});
