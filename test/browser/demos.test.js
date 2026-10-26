import { readdirSync } from 'node:fs';
import { expect, test } from '#test';

const demoFiles = readdirSync(new URL('../../demo/', import.meta.url), { recursive: true })
    .map((file) => file.replaceAll('\\', '/'))
    .filter((file) => file.endsWith('.html') && file !== 'index.html');

for (const file of demoFiles) {
    test(`renders demo ${file}`, async ({ page }) => {
        await page.clock.install({ time: 0 });
        await page.clock.pauseAt(1000);
        const response = await page.goto(`/demo/${file}`);
        expect(response.ok()).toBe(true);
        await page.clock.runFor(100);

        const canvases = await page.locator('canvas').evaluateAll((nodes) => nodes.map((canvas) => ({
            example: canvas.parentElement.id,
            width: canvas.width,
            height: canvas.height,
            drawn: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
                .data.some((value, index) => index % 4 === 3 && value > 0),
        })));

        expect(canvases.length).toBeGreaterThan(0);
        for (const canvas of canvases) {
            expect(canvas.width).toBeGreaterThan(0);
            expect(canvas.height).toBeGreaterThan(0);
            // The clear example deliberately erases every pixel.
            const cleared = file === 'canvas-context/canvas.html' && canvas.example === 'clear';
            expect(canvas.drawn, canvas.example).toBe(!cleared);
        }
    });
}

test('lists all examples in the demo index', async ({ page }) => {
    await page.goto('/demo/index.html');
    const links = await page.locator('main a').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    expect(links.sort()).toEqual([...demoFiles].sort());
});
