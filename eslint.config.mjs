import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
    globalIgnores([
        'dist',
        'coverage',
        'tests/public',
    ]),
    {
        files: ['**/*.ts'],
        plugins: {
            '@stylistic': stylistic,
        },
        extends: [
            eslint.configs.recommended,
            tseslint.configs.strict,
            tseslint.configs.stylistic,
        ],
        rules: {
            // Error Prevention
            'eqeqeq': ['error', 'always', { 'null': 'ignore' }],
            'no-cond-assign': ['error', 'always'],
            'no-self-compare': 'error',
            'no-template-curly-in-string': 'error',

            // Best Practices
            'default-case-last': 'error',
            'no-new-wrappers': 'error',
            'radix': 'error',

            // ES6+ Style
            'prefer-template': 'error',
            'object-shorthand': 'error',

            // Stylistic
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/member-delimiter-style': ['error', {
                multiline: {
                    delimiter: 'semi',
                    requireLast: true,
                },
                singleline: {
                    delimiter: 'semi',
                    requireLast: true,
                },
            }],
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
        },
    },
    {
        files: [
            '**/*.test.ts',
            'examples/**/*.ts',
            'benchmarks/**/*.ts',
        ],
        rules: {
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-empty-function': ['error', {
                allow: ['arrowFunctions', 'functions'],
            }],
        },
    },
]);
