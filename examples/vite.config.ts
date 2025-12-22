import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
    root: __dirname,
    plugins: [
        mkcert(),
    ],
    server: {
        // @ts-expect-error: https is not defined in vite types
        https: true,
        headers: {
            // Required for SharedArrayBuffer (sync API)
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
});
