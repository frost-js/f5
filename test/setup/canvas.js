/**
 * @import { Page } from '@playwright/test';
 */

/**
 * Creates an isolated canvas and parent container for drawing and input tests.
 * @param {{page: Page}} fixtures The Playwright fixtures.
 */
export async function setupCanvas({ page }) {
    await page.evaluate(() => {
        window.sketch?.destroy();
        document.body.innerHTML = '<div id="root"></div><canvas id="canvas"></canvas>';
        window.sketch = null;
    });
}
