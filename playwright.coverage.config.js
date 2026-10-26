import process from 'node:process';
import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.js';

process.env.F5_COVERAGE = 'true';

const normalizePath = (filePath) => filePath.replaceAll('\\', '/');
const sourceMapUrl = new URL('./dist/f5.js.map', import.meta.url).href;

export default defineConfig({
    ...baseConfig,
    projects: [
        {
            name: 'coverage',
            use: { browserName: 'chromium' },
        },
    ],
    reporter: [
        ['line'],
        [
            'monocart-reporter',
            {
                name: 'F5 Coverage',
                outputFile: './test-results/coverage/index.html',
                coverage: {
                    name: 'F5 Source Coverage',
                    outputDir: './coverage',
                    reports: [
                        'console-summary',
                        'html',
                        'lcovonly',
                    ],
                    entryFilter: (entry) => normalizePath(entry.url).endsWith('/dist/f5.js'),
                    sourceFilter: (sourcePath) => normalizePath(sourcePath).startsWith('src/'),
                    sourceMapResolver: (_url, defaultResolver) => defaultResolver(sourceMapUrl),
                    all: './src',
                },
            },
        ],
    ],
});
