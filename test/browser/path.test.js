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

    test.describe('#render', () => {
        test('renders fills without padding for an unused stroke width', async ({ page }) => {
            const result = await page.evaluate(() => {
                const path = new F5.Path(document.getElementById('canvas').getContext('2d'))
                    .rect(10, 20, 30, 40);
                const canvas = path.render({ fillStyle: '#ff0000', lineWidth: 4, strokeStyle: null });
                const context = canvas.getContext('2d');

                return {
                    width: canvas.width,
                    height: canvas.height,
                    first: [...context.getImageData(0, 0, 1, 1).data],
                    last: [...context.getImageData(29, 39, 1, 1).data],
                };
            });

            expect(result.width).toBe(30);
            expect(result.height).toBe(40);
            expect(result.first).toEqual([255, 0, 0, 255]);
            expect(result.last).toEqual([255, 0, 0, 255]);
        });

        test('pads strokes and places them around the geometry', async ({ page }) => {
            const result = await page.evaluate(() => {
                const path = new F5.Path(document.getElementById('canvas').getContext('2d'))
                    .rect(10, 20, 30, 40);
                const canvas = path.render({ lineWidth: 4, strokeStyle: '#ff0000' });
                const context = canvas.getContext('2d');

                return {
                    width: canvas.width,
                    height: canvas.height,
                    edge: [...context.getImageData(4, 20, 1, 1).data],
                    inside: [...context.getImageData(15, 20, 1, 1).data],
                    outside: [...context.getImageData(0, 20, 1, 1).data],
                };
            });

            expect(result.width).toBe(38);
            expect(result.height).toBe(48);
            expect(result.edge).toEqual([255, 0, 0, 255]);
            expect(result.inside).toEqual([0, 0, 0, 0]);
            expect(result.outside).toEqual([0, 0, 0, 0]);
        });

        test('includes the offset shadow in the rendered canvas', async ({ page }) => {
            const result = await page.evaluate(() => {
                const path = new F5.Path(document.getElementById('canvas').getContext('2d'))
                    .rect(10, 20, 30, 40);
                const canvas = path.render({
                    fillStyle: '#ff0000',
                    shadowColor: '#000',
                    shadowBlur: 3,
                    shadowOffsetX: 4,
                    shadowOffsetY: -2,
                    strokeStyle: null,
                });
                const context = canvas.getContext('2d');

                return {
                    width: canvas.width,
                    height: canvas.height,
                    fill: [...context.getImageData(10, 20, 1, 1).data],
                    shadow: context.getImageData(32, 20, 1, 1).data[3],
                };
            });

            expect(result.width).toBe(37);
            expect(result.height).toBe(46);
            expect(result.fill).toEqual([255, 0, 0, 255]);
            expect(result.shadow).toBeGreaterThan(0);
        });

        test('rounds fractional bounds outward without shifting the geometry', async ({ page }) => {
            const result = await page.evaluate(() => {
                const path = new F5.Path(document.getElementById('canvas').getContext('2d'))
                    .rect(10.2, 20.25, 30.4, 40.1);
                const canvas = path.render({ fillStyle: '#ff0000', strokeStyle: null });
                const context = canvas.getContext('2d');

                return {
                    width: canvas.width,
                    height: canvas.height,
                    left: context.getImageData(0, 10, 1, 1).data[3],
                    right: context.getImageData(30, 10, 1, 1).data[3],
                };
            });

            expect(result.width).toBe(31);
            expect(result.height).toBe(41);
            expect(result.left).toBeGreaterThan(0);
            expect(result.left).toBeLessThan(255);
            expect(result.right).toBeGreaterThan(0);
            expect(result.right).toBeLessThan(255);
        });
    });
});
