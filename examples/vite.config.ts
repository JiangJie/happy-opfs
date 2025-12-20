import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
    root: __dirname,
    plugins: [
        mkcert(),
    ],
    server: {
        headers: {
            // Required for SharedArrayBuffer (sync API)
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
});
