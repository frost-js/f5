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

        test('allows later layers to fill a contour again', async ({ page }) => {
            const shape = await page.evaluateHandle(() => {
                return new F5.Shape(document.getElementById('canvas').getContext('2d'))
                    .layer((path) => path.rect(0, 0, 40, 40))
                    .contour((path) => path.rect(10, 10, 20, 20))
                    .layer((path) => path.rect(15, 15, 10, 10));
            });

            expect(await shape.evaluate((shape) => shape.containsPoint(5, 5))).toBe(true);
            expect(await shape.evaluate((shape) => shape.containsPoint(12, 12))).toBe(false);
            expect(await shape.evaluate((shape) => shape.containsPoint(20, 20))).toBe(true);
            expect(await shape.evaluate((shape) => shape.containsPoint(45, 45))).toBe(false);
        });

        test('transforms hit tests around a nonzero anchor', async ({ page }) => {
            const shape = await page.evaluateHandle(() => {
                return new F5.Shape(document.getElementById('canvas').getContext('2d'), 30, 40, Math.PI / 2, 10, 10)
                    .layer((path) => path.rect(0, 0, 20, 10));
            });

            expect(await shape.evaluate((shape) => shape.containsPoint(45, 45))).toBe(true);
            expect(await shape.evaluate((shape) => shape.containsPoint(35, 45))).toBe(false);

            await shape.evaluate((shape) => shape.x = 50);

            expect(await shape.evaluate((shape) => shape.containsPoint(45, 45))).toBe(false);
            expect(await shape.evaluate((shape) => shape.containsPoint(65, 45))).toBe(true);
        });
    });

    test.describe('#getBoundingBox', () => {
        test('unions visible layers without expanding for contours', async ({ page }) => {
            const bounds = await page.evaluate(() => {
                return new F5.Shape(document.getElementById('canvas').getContext('2d'), 5, 6)
                    .layer((path) => path.rect(10, 20, 30, 40))
                    .layer((path) => path.rect(-10, -20, 5, 5))
                    .contour((path) => path.rect(-100, -100, 200, 200))
                    .getBoundingBox();
            });

            expect(bounds.left).toBe(-5);
            expect(bounds.top).toBe(-14);
            expect(bounds.right).toBe(45);
            expect(bounds.bottom).toBe(66);
        });

        test('returns empty bounds when there are only contours', async ({ page }) => {
            const shape = await page.evaluateHandle(() => {
                return new F5.Shape(document.getElementById('canvas').getContext('2d'))
                    .contour((path) => path.rect(10, 20, 30, 40));
            });
            const bounds = await shape.evaluate((shape) => shape.getBoundingBox());

            expect(bounds.x).toBe(0);
            expect(bounds.y).toBe(0);
            expect(bounds.width).toBe(0);
            expect(bounds.height).toBe(0);
            expect(await shape.evaluate((shape) => shape.containsPoint(15, 25))).toBe(false);
        });

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

    test.describe('#render', () => {
        test('renders layers and contours at higher density', async ({ page }) => {
            const canvas = await page.evaluateHandle(() => {
                return new F5.Shape(document.getElementById('canvas').getContext('2d'))
                    .layer((path) => path.rect(0, 0, 20, 20))
                    .contour((path) => path.rect(5.25, 5.25, 5.5, 5.5))
                    .render({ fillStyle: '#ff0000' }, 4);
            });

            expect(await canvas.evaluate((node) => node.width)).toBe(80);
            expect(await canvas.evaluate((node) => node.height)).toBe(80);
            expect(await canvas.evaluate((node) => [...node.getContext('2d').getImageData(21, 30, 1, 1).data]))
                .toEqual([0, 0, 0, 0]);
            expect(await canvas.evaluate((node) => [...node.getContext('2d').getImageData(20, 30, 1, 1).data]))
                .toEqual([255, 0, 0, 255]);
        });

        for (const pixelRatio of [0, -1, Infinity, NaN]) {
            test(`rejects a pixel ratio of ${pixelRatio}`, async ({ page }) => {
                const geometry = await page.evaluateHandle(() => {
                    return new F5.Shape(document.getElementById('canvas').getContext('2d'));
                });

                await expect(geometry.evaluate((geometry, pixelRatio) => geometry.render({}, pixelRatio), pixelRatio))
                    .rejects.toThrow('Render pixel ratio must be a positive, finite number.');
            });
        }

        test('renders an empty shape to a zero-sized canvas', async ({ page }) => {
            const size = await page.evaluate(() => {
                const shape = new F5.Shape(document.getElementById('canvas').getContext('2d'));
                const canvas = shape.render();

                return { width: canvas.width, height: canvas.height };
            });

            expect(size.width).toBe(0);
            expect(size.height).toBe(0);
        });

        test('erases contours and paints later layers in order', async ({ page }) => {
            const canvas = await page.evaluateHandle(() => {
                const shape = new F5.Shape(document.getElementById('canvas').getContext('2d'))
                    .layer((path) => path.rect(0, 0, 40, 40))
                    .contour((path) => path.rect(10, 10, 20, 20))
                    .layer((path) => path.rect(15, 15, 10, 10));

                return shape.render({ fillStyle: '#ff0000' });
            });

            expect(await canvas.evaluate((node) => [...node.getContext('2d').getImageData(5, 5, 1, 1).data]))
                .toEqual([255, 0, 0, 255]);
            expect(await canvas.evaluate((node) => [...node.getContext('2d').getImageData(12, 12, 1, 1).data]))
                .toEqual([0, 0, 0, 0]);
            expect(await canvas.evaluate((node) => [...node.getContext('2d').getImageData(20, 20, 1, 1).data]))
                .toEqual([255, 0, 0, 255]);
        });

        test('rotates rendered geometry around a nonzero anchor', async ({ page }) => {
            const context = await page.evaluateHandle(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 80, 80);
                const shape = context.createShape(30, 40, Math.PI / 2, 10, 10)
                    .layer((path) => path.rect(0, 0, 20, 10));

                context.noStroke().fill('#ff0000').drawShape(shape);

                return context;
            });

            expect(await context.evaluate((context) => [...context.getImage(45, 45, 1, 1).data]))
                .toEqual([255, 0, 0, 255]);
            expect(await context.evaluate((context) => [...context.getImage(35, 45, 1, 1).data]))
                .toEqual([0, 0, 0, 0]);
        });

        test('positions the layers and their shadows inside the rendered bounds', async ({ page }) => {
            const result = await page.evaluate(() => {
                const shape = new F5.Shape(document.getElementById('canvas').getContext('2d'), 5, 6)
                    .layer((path) => path.rect(10, 20, 30, 40));
                const canvas = shape.render({
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
    });
});
