import { defineConfig } from '@playwright/test';

export default defineConfig({
    fullyParallel: true,
    reporter: 'list',
    testDir: './test/unit',
    testMatch: [
        '**/*.spec.js',
    ],
});
