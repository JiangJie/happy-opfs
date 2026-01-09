import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
    root: 'benchmarks',
    plugins: [mkcert()],
});
