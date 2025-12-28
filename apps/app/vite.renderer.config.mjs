import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
    root: 'src/renderer',
    base: './',
    plugins: [react()],
    resolve: {
        dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    build: {
        outDir: '../../.vite/renderer/main_window',
        rollupOptions: {
            input: 'src/renderer/index.html'
        },
    },
    publicDir: '../../public',
});
