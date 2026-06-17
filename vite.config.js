import { defineConfig } from 'vite';
import generateSWPlugin from './scripts/generate-sw-plugin.js';

export default defineConfig({
    base: './',
    build: {
        outDir: 'dist',
        assetsInlineLimit: 0,
        rollupOptions: {
            output: {
                manualChunks: {
                    d3: ['./js/map/mapInit.js'],
                },
            },
        },
    },
    plugins: [
        generateSWPlugin(),
    ],
});
