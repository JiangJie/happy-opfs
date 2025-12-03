import path from 'node:path';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
    root: path.resolve(__dirname, 'tests'),
    plugins: [
        mkcert({
            source: 'coding',
        }),
    ],
    server: {
        https: true,
        host: 'localhost',
        port: 8443,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        },
    },
});