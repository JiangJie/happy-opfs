import type { RollupOptions } from 'rollup';
import { dts } from 'rollup-plugin-dts';

const config: RollupOptions[] = [
    {
        input: 'src/mod.ts',
        plugins: [
            dts(),
        ],
        // NodeNext infers declaration module format from the extension, so the CJS and ESM entries need separate files.
        output: [
            {
                file: 'dist/types.d.ts',
                format: 'esm',
                sourcemap: false,
            },
            {
                file: 'dist/types.d.cts',
                format: 'esm',
                sourcemap: false,
            },
        ],
        treeshake: 'smallest',
    },
];

export default config;
