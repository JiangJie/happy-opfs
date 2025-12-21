import type { RollupOptions } from 'rollup';
import { dts } from 'rollup-plugin-dts';

const config: RollupOptions[] = [
    {
        input: 'src/mod.ts',
        plugins: [
            dts(),
        ],
        output: {
            file: 'dist/types.d.ts',
            format: 'esm',
            sourcemap: false,
        },
        treeshake: 'smallest',
    },
];

export default config;
