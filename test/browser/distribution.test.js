import { expect, test } from '#test';

const publicExports = ['Canvas', 'CanvasContext', 'Path', 'Shape', 'Vector'];

for (const entry of ['/src/index.js', '/dist/f5.esm.js', '/dist/f5.esm.min.js']) {
    test(`imports and renders through ${entry}`, async ({ page }) => {
        await page.goto('/source');
        const result = await page.evaluate(async (url) => {
            const library = await import(url);
            const canvas = document.getElementById('canvas');
            const context = new library.CanvasContext(canvas, 16, 16);
            context.noStroke().fill('#0080ff').rect(0, 0, 16, 16);

            return {
                exports: Object.keys(library).sort(),
                pixel: [...context.getImage(8, 8, 1, 1).data],
                magnitude: library.Vector.create(3, 4).getMag(),
            };
        }, entry);

        expect(result).toEqual({
            exports: publicExports,
            pixel: [0, 128, 255, 255],
            magnitude: 5,
        });
    });
}

test('loads the minified UMD bundle without a module loader', async ({ page }) => {
    await page.goto('/source');
    await page.addScriptTag({ url: '/dist/f5.min.js' });
    const result = await page.evaluate(() => {
        const context = new F5.CanvasContext(document.getElementById('canvas'), 16, 16);
        context.noStroke().fill('#ff0000').circle(8, 8, 4);

        return {
            exports: Object.keys(F5).sort(),
            pixel: [...context.getImage(8, 8, 1, 1).data],
        };
    });

    expect(result).toEqual({ exports: publicExports, pixel: [255, 0, 0, 255] });
});
