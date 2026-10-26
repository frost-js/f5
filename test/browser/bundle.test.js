import { expect, test } from '#test';

test.describe('Bundle Smoke', () => {
    test('loads the built bundle and exposes a working public API', async ({ page }) => {
        const result = await page.evaluate(() => {
            const exports = Object.keys(window.F5).sort();
            const { CanvasContext } = window.F5;
            const canvas = document.getElementById('canvas');
            const context = new CanvasContext(canvas, 12, 12);

            context.noStroke().fill('#ff0000').rect(0, 0, 12, 12);

            return {
                exports,
                pixel: Array.from(context.getImage(6, 6, 1, 1).data),
            };
        });

        expect(result.exports).toEqual([
            'Canvas',
            'CanvasContext',
            'Path',
            'Shape',
            'Vector',
        ]);
        expect(result.pixel).toEqual([255, 0, 0, 255]);
    });
});
