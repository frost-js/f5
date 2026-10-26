import { expect, test } from '#test';
import { setupCanvas } from '../setup/canvas.js';

test.describe('Shape', () => {
    test.beforeEach(setupCanvas);

    test.describe('#containsPoint', () => {
        test('subtracts contours when testing points', async ({ page }) => {
            const result = await page.evaluate(() => {
                const { Shape } = window.F5;
                const canvas = document.getElementById('canvas');
                const context = canvas.getContext('2d');

                const contourShape = new Shape(context, 10, 10)
                    .layer((path) => {
                        path.rect(0, 0, 40, 40);
                    })
                    .contour((path) => {
                        path.rect(10, 10, 20, 20);
                    });

                return {
                    hole: contourShape.containsPoint(30, 30),
                    outer: contourShape.containsPoint(15, 15),
                    outside: contourShape.containsPoint(60, 60),
                };
            });

            expect(result.outer).toBe(true);
            expect(result.hole).toBe(false);
            expect(result.outside).toBe(false);
        });
    });

    test.describe('#getBoundingBox', () => {
        test('rotates layer bounds around the shape anchor', async ({ page }) => {
            const bounds = await page.evaluate(() => {
                const { Shape } = window.F5;
                const canvas = document.getElementById('canvas');
                const context = canvas.getContext('2d');

                const rotatedShape = new Shape(context, 0, 0, Math.PI / 2)
                    .layer((path) => {
                        path.rect(0, 0, 10, 20);
                    });

                return rotatedShape.getBoundingBox();
            });

            expect(bounds.left).toBeCloseTo(-20);
            expect(bounds.top).toBeCloseTo(0);
            expect(bounds.width).toBeCloseTo(20);
            expect(bounds.height).toBeCloseTo(10);
        });
    });
});
