/** @import { Page } from '@playwright/test'; */

/**
 * Loads the built library with an isolated canvas and parent container.
 * @param {Page} page The browser page.
 */
export async function setupCanvas(page) {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        if (typeof window.F5?.Canvas !== 'function') {
            throw new Error('Failed to load F5 on the test page.');
        }
    });
}
