import frostConfig, { browserConfig, nodeConfig } from '@fr0st/eslint-config';

export default [
    {
        ignores: [
            '.tmp/**',
            'coverage/**',
            'dist/**',
            'playwright-report/**',
            'test-results/**',
        ],
    },
    frostConfig,
    browserConfig,
    {
        ...nodeConfig,
        files: [
            '*.config.js',
            'test/**/*.js',
        ],
    },
    {
        name: '@fr0st/f5/browser-globals',
        files: [
            'demo/**/*.js',
            'test/**/*.js',
        ],
        languageOptions: {
            globals: {
                F5: 'readonly',
            },
        },
    },
];
