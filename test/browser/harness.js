export async function gotoBundleHarness(page) {
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.F5));
}

export async function gotoSourceHarness(page) {
    await page.goto('/source');
    await page.evaluate(async () => {
        window.F5 = await import('/src/index.js');
    });
    await page.waitForFunction(() => Boolean(window.F5));
}

