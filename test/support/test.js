import process from 'node:process';
import { test as base, expect } from '@playwright/test';
import { addCoverageReport } from 'monocart-reporter';
import { setupCanvas } from '../setup/canvas.js';

const collectCoverage = process.env.F5_COVERAGE === 'true';

const test = base.extend({
    expectedBrowserErrors: [[], { option: true }],
    canvasPage: [
        async ({ page, expectedBrowserErrors }, use, testInfo) => {
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));

            if (collectCoverage) {
                await page.coverage.startJSCoverage({ resetOnNavigation: false });
            }

            await setupCanvas(page);

            try {
                await use();
            } finally {
                await page.evaluate(() => {
                    window.sketch?.destroy();
                    delete window.sketch;
                });

                if (collectCoverage) {
                    const coverage = await page.coverage.stopJSCoverage();

                    // Pages such as the demo index may execute no JavaScript.
                    if (coverage.length) {
                        await addCoverageReport(coverage, testInfo);
                    }
                }

                expect(errors, 'Uncaught browser errors').toEqual(expectedBrowserErrors);
            }
        },
        { auto: true },
    ],
});

export { expect, test };
