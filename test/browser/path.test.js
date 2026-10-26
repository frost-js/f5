import { expect, test } from '#test';
import { setupCanvas } from '../setup/canvas.js';

test.describe('Path', () => {
    test.beforeEach(setupCanvas);

    test.describe('rectangles', () => {
        test('computes path bounds, containment, and render size', async ({ page }) => {
            const path = await page.evaluateHandle(() => {
                return new F5.Path(document.getElementById('canvas').getContext('2d')).rect(10, 20, 30, 40);
            });
            const bounds = await path.evaluate((path) => path.getBoundingBox());
            const rendered = await path.evaluateHandle((path) => path.render({ fillStyle: '#ff0000', lineWidth: 0 }));

            expect(bounds.x).toBe(10);
            expect(bounds.y).toBe(20);
            expect(bounds.left).toBe(10);
            expect(bounds.top).toBe(20);
            expect(bounds.right).toBe(40);
            expect(bounds.bottom).toBe(60);
            expect(bounds.width).toBe(30);
            expect(bounds.height).toBe(40);
            expect(await path.evaluate((path) => path.containsPoint(15, 25))).toBe(true);
            expect(await path.evaluate((path) => path.containsPoint(5, 10))).toBe(false);
            expect(await rendered.evaluate((node) => node.width)).toBe(30);
            expect(await rendered.evaluate((node) => node.height)).toBe(40);
        });
    });

    test.describe('primitives', () => {
        for (const { method, args, left, top, right, bottom } of [
            { method: 'square', args: [10, 20, 30], left: 10, top: 20, right: 40, bottom: 50 },
            { method: 'rect', args: [40, 50, -30, -30], left: 10, top: 20, right: 40, bottom: 50 },
            { method: 'triangle', args: [10, 50, 25, 20, 40, 50], left: 10, top: 20, right: 40, bottom: 50 },
            { method: 'quad', args: [10, 20, 40, 20, 40, 50, 10, 50], left: 10, top: 20, right: 40, bottom: 50 },
            { method: 'circle', args: [25, 35, 15], left: 10, top: 20, right: 40, bottom: 50 },
            { method: 'ellipse', args: [25, 35, 20, 30, Math.PI / 2], left: 10, top: 25, right: 40, bottom: 45 },
        ]) {
            test(`bounds and hit tests a ${method}`, async ({ page }) => {
                const path = await page.evaluateHandle(({ method, args }) => {
                    return new F5.Path(document.getElementById('canvas').getContext('2d'))[method](...args);
                }, { method, args });
                const bounds = await path.evaluate((path) => path.getBoundingBox());

                expect(bounds.left).toBeCloseTo(left);
                expect(bounds.top).toBeCloseTo(top);
                expect(bounds.right).toBeCloseTo(right);
                expect(bounds.bottom).toBeCloseTo(bottom);
                expect(await path.evaluate((path) => path.containsPoint(25, 35))).toBe(true);
                expect(await path.evaluate((path) => path.containsPoint(0, 0))).toBe(false);
            });
        }

        test('keeps separate line segments in separate subpaths', async ({ page }) => {
            const canvas = await page.evaluateHandle(() => {
                const path = new F5.Path(document.getElementById('canvas').getContext('2d'));

                path.line(10, 10, 20, 10).line(30, 10, 40, 10);

                return path.render({ strokeStyle: '#ff0000', lineWidth: 4 });
            });

            expect(await canvas.evaluate((node) => [...node.getContext('2d').getImageData(9, 4, 1, 1).data]))
                .toEqual([255, 0, 0, 255]);
            expect(await canvas.evaluate((node) => [...node.getContext('2d').getImageData(19, 4, 1, 1).data]))
                .toEqual([0, 0, 0, 0]);
        });
    });

    test.describe('connected paths', () => {
        test('closes connected vertices into a polygon', async ({ page }) => {
            const path = await page.evaluateHandle(() => {
                return new F5.Path(document.getElementById('canvas').getContext('2d'))
                    .vertex(10, 10).vertex(30, 10).vertex(30, 30).vertex(10, 30).close();
            });

            expect(await path.evaluate((path) => path.containsPoint(20, 20))).toBe(true);
            expect(await path.evaluate((path) => path.containsPoint(5, 20))).toBe(false);
            expect(await path.evaluate((path) => path.getBoundingBox().width)).toBe(20);
            expect(await path.evaluate((path) => path.getBoundingBox().height)).toBe(20);
        });

        test('continues from the subpath start after closing an arc', async ({ page }) => {
            const bounds = await page.evaluate(() => {
                return new F5.Path(document.getElementById('canvas').getContext('2d'))
                    .arc(0, 0, 10, 0, Math.PI / 2).close().quadraticVertex(20, 0, 10, 10)
                    .getBoundingBox();
            });

            expect(bounds.left).toBeCloseTo(0);
            expect(bounds.right).toBeCloseTo(15);
            expect(bounds.top).toBeCloseTo(0);
            expect(bounds.bottom).toBeCloseTo(10);
        });

        test('allows closing an empty path without adding geometry', async ({ page }) => {
            const path = await page.evaluateHandle(() => {
                return new F5.Path(document.getElementById('canvas').getContext('2d')).close();
            });
            const bounds = await path.evaluate((path) => path.getBoundingBox());

            expect(bounds.x).toBe(0);
            expect(bounds.y).toBe(0);
            expect(bounds.width).toBe(0);
            expect(bounds.height).toBe(0);
            expect(await path.evaluate((path) => path.containsPoint(0, 0))).toBe(false);
        });
    });

    test.describe('bezier curves', () => {
        test('bounds a quadratic curve by its extrema', async ({ page }) => {
            const bounds = await page.evaluate(() => {
                return new F5.Path(document.getElementById('canvas').getContext('2d'))
                    .vertex(0, 0).quadraticVertex(10, 20, 20, 0).getBoundingBox();
            });

            expect(bounds.left).toBe(0);
            expect(bounds.right).toBe(20);
            expect(bounds.top).toBe(0);
            expect(bounds.bottom).toBeCloseTo(10);
        });

        test('bounds a connected cubic curve by its extrema', async ({ page }) => {
            const bounds = await page.evaluate(() => {
                return new F5.Path(document.getElementById('canvas').getContext('2d'))
                    .vertex(0, 0).bezierVertex(10, 20, 20, 20, 30, 0).getBoundingBox();
            });

            expect(bounds.left).toBe(0);
            expect(bounds.right).toBe(30);
            expect(bounds.top).toBe(0);
            expect(bounds.bottom).toBeCloseTo(15);
        });

        test('includes both extrema of an S-shaped cubic curve', async ({ page }) => {
            const bounds = await page.evaluate(() => {
                return new F5.Path(document.getElementById('canvas').getContext('2d'))
                    .bezier(0, 0, 10, 30, 20, -30, 30, 0).getBoundingBox();
            });

            expect(bounds.left).toBe(0);
            expect(bounds.right).toBe(30);
            expect(bounds.top).toBeCloseTo(-5 * Math.sqrt(3));
            expect(bounds.bottom).toBeCloseTo(5 * Math.sqrt(3));
        });

        for (const { method, args } of [
            { method: 'quadraticVertex', args: [10, 10, 30, 30] },
            { method: 'bezierVertex', args: [10, 10, 20, 20, 30, 30] },
        ]) {
            test(`starts ${method} at the first control point when the path is empty`, async ({ page }) => {
                const bounds = await page.evaluate(({ method, args }) => {
                    const path = new F5.Path(document.getElementById('canvas').getContext('2d'));

                    return path[method](...args).getBoundingBox();
                }, { method, args });

                expect(bounds.left).toBe(10);
                expect(bounds.top).toBe(10);
                expect(bounds.right).toBe(30);
                expect(bounds.bottom).toBe(30);
            });
        }
    });

    test.describe('arcs', () => {
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

        for (const { name, start, end, left, top, right, bottom } of [
            { name: 'a semicircle', start: 0, end: Math.PI, left: -10, top: 0, right: 10, bottom: 10 },
            { name: 'a full circle', start: 0, end: Math.PI * 2, left: -10, top: -10, right: 10, bottom: 10 },
            { name: 'a sweep across zero', start: -Math.PI / 2, end: Math.PI / 2, left: 0, top: -10, right: 10, bottom: 10 },
            { name: 'a zero-length sweep', start: 0, end: 0, left: 10, top: 0, right: 10, bottom: 0 },
        ]) {
            test(`bounds ${name}`, async ({ page }) => {
                const bounds = await page.evaluate(({ start, end }) => {
                    return new F5.Path(document.getElementById('canvas').getContext('2d'))
                        .arc(0, 0, 10, start, end).getBoundingBox();
                }, { start, end });

                expect(bounds.left).toBeCloseTo(left);
                expect(bounds.top).toBeCloseTo(top);
                expect(bounds.right).toBeCloseTo(right);
                expect(bounds.bottom).toBeCloseTo(bottom);
            });
        }

        test('bounds a counterclockwise tangent arc without including the control corner', async ({ page }) => {
            const bounds = await page.evaluate(() => {
                return new F5.Path(document.getElementById('canvas').getContext('2d'))
                    .vertex(0, 10).curveVertex(10, 10, 10, 0, 5).getBoundingBox();
            });

            expect(bounds.left).toBeCloseTo(0);
            expect(bounds.top).toBeCloseTo(5);
            expect(bounds.right).toBeCloseTo(10);
            expect(bounds.bottom).toBeCloseTo(10);
        });

        for (const { name, args } of [
            { name: 'zero radius', args: [0, 0, 10, 0, 10, 10, 0] },
            { name: 'collinear points', args: [0, 0, 10, 0, 20, 0, 5] },
            { name: 'coincident control points', args: [0, 0, 10, 0, 10, 0, 5] },
        ]) {
            test(`reduces a tangent arc with ${name} to a line`, async ({ page }) => {
                const bounds = await page.evaluate((args) => {
                    return new F5.Path(document.getElementById('canvas').getContext('2d'))
                        .curve(...args).getBoundingBox();
                }, args);

                expect(bounds.left).toBe(0);
                expect(bounds.right).toBe(10);
                expect(bounds.top).toBe(0);
                expect(bounds.bottom).toBe(0);
            });
        }

        test('starts a tangent arc at its first control point when the path is empty', async ({ page }) => {
            const bounds = await page.evaluate(() => {
                return new F5.Path(document.getElementById('canvas').getContext('2d'))
                    .curveVertex(10, 20, 30, 40, 5).getBoundingBox();
            });

            expect(bounds.x).toBe(10);
            expect(bounds.y).toBe(20);
            expect(bounds.width).toBe(0);
            expect(bounds.height).toBe(0);
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
