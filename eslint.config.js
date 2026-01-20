import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/tests/k6/**', '**/*.config.js'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        files: ['**/*.ts', '**/*.js'],
        languageOptions: {
            globals: {
                console: 'readonly',
                process: 'readonly',
                module: 'readonly',
                require: 'readonly',
                __dirname: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                jest: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            'no-undef': 'off', // TypeScript handles this
        },
    },
];
