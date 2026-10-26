import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './test/browser',
    testMatch: [
        '**/*.spec.js',
    ],
    fullyParallel: true,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:4173',
        headless: true,
    },
    webServer: {
        command: 'node test/support/server.js',
        port: 4173,
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
    },
    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
            },
        },
    ],
});
