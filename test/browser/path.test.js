import { expect, test } from '#test';
import { setupCanvas } from '../setup/canvas.js';

test.describe('Path', () => {
    test.beforeEach(setupCanvas);

    test.describe('bounds and rendering', () => {
        test('computes path bounds, containment, and render size', async ({ page }) => {
            const result = await page.evaluate(() => {
                const { Path } = window.F5;
                const canvas = document.getElementById('canvas');
                const context = canvas.getContext('2d');
                const path = new Path(context);

                path.rect(10, 20, 30, 40);

                const rendered = path.render({
                    fillStyle: '#ff0000',
                    lineWidth: 0,
                });

                return {
                    bounds: path.getBoundingBox(),
                    containsInside: path.containsPoint(15, 25),
                    containsOutside: path.containsPoint(5, 10),
                    renderHeight: rendered.height,
                    renderWidth: rendered.width,
                };
            });

            expect(result.bounds).toEqual({
                bottom: 60,
                height: 40,
                left: 10,
                right: 40,
                top: 20,
                width: 30,
                x: 10,
                y: 20,
            });
            expect(result.containsInside).toBe(true);
            expect(result.containsOutside).toBe(false);
            expect(result.renderWidth).toBe(30);
            expect(result.renderHeight).toBe(40);
        });

        test('does not clip large arc-to curves', async ({ page }) => {
            const result = await page.evaluate(() => {
                const { Path } = window.F5;
                const canvas = document.getElementById('canvas');
                const path = new Path(canvas.getContext('2d'));

                path.curve(0, 0, 10, 0, 10, 10, 100);

                const rendered = path.render({
                    lineWidth: 1,
                    strokeStyle: '#000',
                });

                return {
                    bounds: path.getBoundingBox(),
                    height: rendered.height,
                    width: rendered.width,
                };
            });

            expect(result.bounds.left).toBeCloseTo(-90);
            expect(result.bounds.bottom).toBeCloseTo(100);
            expect(result.width).toBeGreaterThanOrEqual(101);
            expect(result.height).toBeGreaterThanOrEqual(101);
        });
    });
});
