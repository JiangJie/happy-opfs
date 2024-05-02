/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    plugins: [
        '@typescript-eslint',
    ],
    parser: '@typescript-eslint/parser',
    ignorePatterns: [
        '**/*.js',
        '**/*.cjs',
        '**/*.mjs',
        '**/*.d.ts',
    ],
};