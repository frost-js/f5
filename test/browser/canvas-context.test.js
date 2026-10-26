import { expect, test } from '#test';
import { setupCanvas } from '../setup/canvas.js';

test.describe('CanvasContext', () => {
    test.beforeEach(setupCanvas);

    test.describe('constructor', () => {
        test('merges constructor options into the active options', async ({ page }) => {
            const options = await page.evaluate(() => {
                const { CanvasContext } = window.F5;
                const canvas = document.getElementById('canvas');
                const context = new CanvasContext(canvas, 20, 20, {
                    fillStyle: '#f00',
                    lineWidth: 4,
                });

                return context.getOptions();
            });

            expect(options.fillStyle).toBe('#f00');
            expect(options.lineWidth).toBe(4);
        });
    });

    test.describe('shared defaults', () => {
        test('copies customized defaults and allows per-context overrides', async ({ page }) => {
            const result = await page.evaluate(() => {
                const { CanvasContext } = F5;
                const original = CanvasContext.defaults.fillStyle;

                try {
                    CanvasContext.defaults.fillStyle = '#ff0000';

                    const first = new CanvasContext(document.createElement('canvas'), 20, 20);
                    const override = new CanvasContext(document.createElement('canvas'), 20, 20, {
                        fillStyle: '#0000ff',
                    });

                    CanvasContext.defaults.fillStyle = '#00ff00';

                    const second = new CanvasContext(document.createElement('canvas'), 20, 20);
                    const beforeReset = first.getOptions().fillStyle;

                    first.reset();

                    return {
                        beforeReset,
                        afterReset: first.getOptions().fillStyle,
                        second: second.getOptions().fillStyle,
                        override: override.getOptions().fillStyle,
                    };
                } finally {
                    CanvasContext.defaults.fillStyle = original;
                }
            });

            expect(result.beforeReset).toBe('#ff0000');
            expect(result.afterReset).toBe('#00ff00');
            expect(result.second).toBe('#00ff00');
            expect(result.override).toBe('#0000ff');
        });
    });

    test.describe('state', () => {
        test('restores pushed state and resets to defaults', async ({ page }) => {
            const state = await page.evaluate(() => {
                const { CanvasContext } = window.F5;
                const canvas = document.getElementById('canvas');
                const context = new CanvasContext(canvas, 20, 20);

                context.fill('#f00').stroke('#0f0').strokeWidth(2);
                context.push().fill('#00f').strokeWidth(5).pop();

                const afterPop = context.getOptions();

                context.reset();

                return {
                    afterPop,
                    afterReset: context.getOptions(),
                    defaults: {
                        ...CanvasContext.defaults,
                    },
                };
            });

            expect(state.afterPop.fillStyle).toBe('#f00');
            expect(state.afterPop.strokeStyle).toBe('#0f0');
            expect(state.afterPop.lineWidth).toBe(2);
            expect(state.afterReset.fillStyle).toBeNull();
            expect(state.afterReset.strokeStyle).toBe('#000');
            expect(state.afterReset.lineWidth).toBe(1);
            expect(state.defaults.fillStyle).toBeNull();
        });
    });

    test.describe('#resize', () => {
        for (const { name, width, height } of [
            { name: 'negative width', width: -1, height: 20 },
            { name: 'negative height', width: 20, height: -1 },
            { name: 'infinite width', width: Infinity, height: 20 },
            { name: 'NaN height', width: 20, height: NaN },
        ]) {
            test(`rejects ${name} without changing the canvas`, async ({ page }) => {
                const context = await page.evaluateHandle(() => {
                    return new F5.CanvasContext(document.getElementById('canvas'), 20, 20);
                });

                await expect(context.evaluate((context, { width, height }) => {
                    context.resize(width, height);
                }, { width, height })).rejects.toThrow('Canvas dimensions must be finite, non-negative numbers.');
                await expect(page.locator('#canvas')).toHaveAttribute('width', '20');
                await expect(page.locator('#canvas')).toHaveAttribute('height', '20');
            });
        }

        test('clears saved state so pop cannot restore stale styles or transforms', async ({ page }) => {
            const result = await page.evaluate(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 20, 20);

                context.translate(10, 10).fill('#ff0000').push().fill('#0000ff');
                context.resize(30, 40).pop().noStroke().rect(0, 0, 4, 4);

                return {
                    fill: context.getOptions().fillStyle,
                    origin: [...context.getImage(1, 1, 1, 1).data],
                    oldPosition: [...context.getImage(11, 11, 1, 1).data],
                };
            });

            await expect(page.locator('#canvas')).toHaveAttribute('width', '30');
            await expect(page.locator('#canvas')).toHaveAttribute('height', '40');
            expect(result.fill).toBe('#0000ff');
            expect(result.origin).toEqual([0, 0, 255, 255]);
            expect(result.oldPosition).toEqual([0, 0, 0, 0]);
        });
    });

    test.describe('background and clearing', () => {
        test('draws and clears the background', async ({ page }) => {
            const pixels = await page.evaluate(() => {
                const { CanvasContext } = window.F5;
                const canvas = document.getElementById('canvas');
                const context = new CanvasContext(canvas, 20, 20);

                context.background('#ff0000');

                const filled = Array.from(context.getImage(10, 10, 1, 1).data);

                context.clear();

                return {
                    cleared: Array.from(context.getImage(10, 10, 1, 1).data),
                    filled,
                };
            });

            expect(pixels.filled).toEqual([255, 0, 0, 255]);
            expect(pixels.cleared).toEqual([0, 0, 0, 0]);
        });

        test('fills the whole canvas after transforms and restores the transform', async ({ page }) => {
            const pixels = await page.evaluate(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 20, 20);

                context.translate(5, 7).background('#ff0000');
                context.noStroke().fill('#0000ff').rect(0, 0, 3, 3);

                return {
                    origin: [...context.getImage(0, 0, 1, 1).data],
                    corner: [...context.getImage(19, 19, 1, 1).data],
                    translated: [...context.getImage(6, 8, 1, 1).data],
                };
            });

            expect(pixels.origin).toEqual([255, 0, 0, 255]);
            expect(pixels.corner).toEqual([255, 0, 0, 255]);
            expect(pixels.translated).toEqual([0, 0, 255, 255]);
        });

        test('clears the whole canvas after transforms and restores the transform', async ({ page }) => {
            const pixels = await page.evaluate(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 20, 20);

                context.background('#ff0000').translate(5, 7).clear();
                context.noStroke().fill('#0000ff').rect(0, 0, 3, 3);

                return {
                    origin: [...context.getImage(0, 0, 1, 1).data],
                    corner: [...context.getImage(19, 19, 1, 1).data],
                    translated: [...context.getImage(6, 8, 1, 1).data],
                };
            });

            expect(pixels.origin).toEqual([0, 0, 0, 0]);
            expect(pixels.corner).toEqual([0, 0, 0, 0]);
            expect(pixels.translated).toEqual([0, 0, 255, 255]);
        });
    });

    test.describe('primitives', () => {
        test('draws points with the stroke color and width', async ({ page }) => {
            const pixels = await page.evaluate(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 20, 20);

                context.stroke('#ff0000').strokeWidth(8).point(10, 10);

                return {
                    center: [...context.getImage(10, 10, 1, 1).data],
                    inside: [...context.getImage(12, 10, 1, 1).data],
                    outside: [...context.getImage(15, 10, 1, 1).data],
                };
            });

            expect(pixels.center).toEqual([255, 0, 0, 255]);
            expect(pixels.inside).toEqual([255, 0, 0, 255]);
            expect(pixels.outside).toEqual([0, 0, 0, 0]);
        });

        for (const { method, args, inside } of [
            { method: 'square', args: [10, 10, 20], inside: [20, 20] },
            { method: 'triangle', args: [10, 30, 20, 10, 30, 30], inside: [20, 25] },
            { method: 'quad', args: [10, 10, 30, 10, 30, 30, 10, 30], inside: [20, 20] },
            { method: 'circle', args: [20, 20, 10], inside: [20, 20] },
            { method: 'ellipse', args: [20, 20, 30, 10, Math.PI / 2], inside: [20, 30] },
            { method: 'arc', args: [20, 20, 10, 0, Math.PI], inside: [20, 25] },
        ]) {
            test(`fills a ${method}`, async ({ page }) => {
                const context = await page.evaluateHandle(({ method, args }) => {
                    const context = new F5.CanvasContext(document.getElementById('canvas'), 40, 40);

                    context.noStroke().fill('#ff0000')[method](...args);

                    return context;
                }, { method, args });

                expect(await context.evaluate((context, point) => [...context.getImage(...point, 1, 1).data], inside)).toEqual([255, 0, 0, 255]);
                expect(await context.evaluate((context) => [...context.getImage(0, 0, 1, 1).data])).toEqual([0, 0, 0, 0]);
            });
        }

        for (const { method, args, edge } of [
            { method: 'line', args: [10, 10, 30, 10], edge: [20, 10] },
            { method: 'bezier', args: [10, 10, 10, 30, 30, 30, 30, 10], edge: [20, 25] },
            { method: 'curve', args: [10, 10, 30, 10, 30, 30, 10], edge: [15, 10] },
        ]) {
            test(`strokes a ${method}`, async ({ page }) => {
                const context = await page.evaluateHandle(({ method, args }) => {
                    const context = new F5.CanvasContext(document.getElementById('canvas'), 40, 40);

                    context.noFill().stroke('#0000ff').strokeWidth(4)[method](...args);

                    return context;
                }, { method, args });

                expect(await context.evaluate((context, point) => [...context.getImage(...point, 1, 1).data], edge)).toEqual([0, 0, 255, 255]);
                expect(await context.evaluate((context) => [...context.getImage(0, 0, 1, 1).data])).toEqual([0, 0, 0, 0]);
            });
        }
    });

    test.describe('connected paths', () => {
        test('closes the final edge and starts the next path independently', async ({ page }) => {
            const context = await page.evaluateHandle(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 60, 40);

                context.noFill().stroke('#ff0000').strokeWidth(4)
                    .begin().vertex(10, 10).vertex(30, 10).vertex(10, 30).end(true);
                context.begin().vertex(40, 10).vertex(50, 10).end();

                return context;
            });

            expect(await context.evaluate((context) => [...context.getImage(10, 20, 1, 1).data])).toEqual([255, 0, 0, 255]);
            expect(await context.evaluate((context) => [...context.getImage(45, 10, 1, 1).data])).toEqual([255, 0, 0, 255]);
            expect(await context.evaluate((context) => [...context.getImage(35, 10, 1, 1).data])).toEqual([0, 0, 0, 0]);
            expect(await context.evaluate((context) => [...context.getImage(15, 15, 1, 1).data])).toEqual([0, 0, 0, 0]);
        });

        test('adds a quadratic curve to the current path', async ({ page }) => {
            const context = await page.evaluateHandle(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 40, 40);

                context.noFill().stroke('#ff0000').strokeWidth(4)
                    .begin().vertex(10, 10).quadraticVertex(20, 30, 30, 10).end();

                return context;
            });

            expect(await context.evaluate((context) => [...context.getImage(20, 20, 1, 1).data])).toEqual([255, 0, 0, 255]);
            expect(await context.evaluate((context) => [...context.getImage(20, 30, 1, 1).data])).toEqual([0, 0, 0, 0]);
        });
    });

    test.describe('transforms', () => {
        test('applies scale transforms when drawing primitives', async ({ page }) => {
            const pixels = await page.evaluate(() => {
                const { CanvasContext } = window.F5;
                const canvas = document.getElementById('canvas');
                const context = new CanvasContext(canvas, 20, 20);

                context.noStroke().fill('#00ff00').scale(2).rect(1, 1, 2, 2);

                return {
                    inside: Array.from(context.getImage(4, 4, 1, 1).data),
                    outside: Array.from(context.getImage(8, 8, 1, 1).data),
                };
            });

            expect(pixels.inside).toEqual([0, 255, 0, 255]);
            expect(pixels.outside).toEqual([0, 0, 0, 0]);
        });

        test('combines a matrix with rotation and restores saved transforms', async ({ page }) => {
            const context = await page.evaluateHandle(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 50, 50);

                context.noStroke().fill('#ff0000').applyMatrix(2, 0, 0, 3, 20, 10).push();
                context.rotate(Math.PI / 2).rect(0, 0, 4, 4);
                context.pop().fill('#0000ff').rect(0, 0, 4, 4);
                context.resetMatrix().fill('#00ff00').rect(0, 0, 4, 4);

                return context;
            });

            expect(await context.evaluate((context) => [...context.getImage(15, 15, 1, 1).data])).toEqual([255, 0, 0, 255]);
            expect(await context.evaluate((context) => [...context.getImage(25, 20, 1, 1).data])).toEqual([0, 0, 255, 255]);
            expect(await context.evaluate((context) => [...context.getImage(1, 1, 1, 1).data])).toEqual([0, 255, 0, 255]);
            expect(await context.evaluate((context) => [...context.getImage(30, 25, 1, 1).data])).toEqual([0, 0, 0, 0]);
        });
    });

    test.describe('gradients and shadows', () => {
        test('fills with a linear gradient', async ({ page }) => {
            const context = await page.evaluateHandle(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 40, 40);
                const gradient = context.linearGradient(10, 0, 30, 0);

                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(1, '#0000ff');
                context.noStroke().fill(gradient).rect(0, 0, 40, 40);

                return context;
            });

            expect(await context.evaluate((context) => [...context.getImage(5, 20, 1, 1).data])).toEqual([255, 0, 0, 255]);
            expect(await context.evaluate((context) => [...context.getImage(35, 20, 1, 1).data])).toEqual([0, 0, 255, 255]);
        });

        test('fills with a radial gradient', async ({ page }) => {
            const context = await page.evaluateHandle(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 40, 40);
                const gradient = context.radialGradient(20, 20, 5, 20, 20, 15);

                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(1, '#0000ff');
                context.noStroke().fill(gradient).rect(0, 0, 40, 40);

                return context;
            });

            expect(await context.evaluate((context) => [...context.getImage(20, 20, 1, 1).data])).toEqual([255, 0, 0, 255]);
            expect(await context.evaluate((context) => [...context.getImage(0, 0, 1, 1).data])).toEqual([0, 0, 255, 255]);
        });

        test('draws an offset shadow and disables it for subsequent drawing', async ({ page }) => {
            const context = await page.evaluateHandle(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 60, 40);

                context.noStroke().fill('#ff0000').shadow('#0000ff').shadowBlur(2).shadowOffset(12, 0)
                    .rect(2, 2, 8, 8);
                context.noShadow().rect(2, 22, 8, 8);

                return context;
            });

            expect(await context.evaluate((context) => [...context.getImage(5, 5, 1, 1).data])).toEqual([255, 0, 0, 255]);
            expect(await context.evaluate((context) => context.getImage(17, 5, 1, 1).data[2])).toBe(255);
            expect(await context.evaluate((context) => context.getImage(17, 5, 1, 1).data[3])).toBeGreaterThan(0);
            expect(await context.evaluate((context) => [...context.getImage(5, 25, 1, 1).data])).toEqual([255, 0, 0, 255]);
            expect(await context.evaluate((context) => [...context.getImage(17, 25, 1, 1).data])).toEqual([0, 0, 0, 0]);
        });
    });

    test.describe('paths, shapes, and erasing', () => {
        test('positions stroked paths using geometry coordinates and drawing offsets', async ({ page }) => {
            const pixels = await page.evaluate(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 80, 80);
                const path = context.createPath().rect(10, 20, 30, 40);

                context.noFill().stroke('#ff0000').strokeWidth(4).drawPath(path, 3, 5);

                return {
                    edge: [...context.getImage(13, 35, 1, 1).data],
                    inside: [...context.getImage(20, 35, 1, 1).data],
                    outside: [...context.getImage(9, 35, 1, 1).data],
                };
            });

            expect(pixels.edge).toEqual([255, 0, 0, 255]);
            expect(pixels.inside).toEqual([0, 0, 0, 0]);
            expect(pixels.outside).toEqual([0, 0, 0, 0]);
        });

        test('positions fill-only shapes independently of the unused stroke width', async ({ page }) => {
            const pixels = await page.evaluate(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 80, 80);
                const shape = context.createShape().layer((path) => path.rect(10, 20, 30, 40));

                context.noStroke().strokeWidth(8).fill('#ff0000').drawShape(shape, 3, 5);

                return {
                    edge: [...context.getImage(13, 25, 1, 1).data],
                    outside: [...context.getImage(12, 25, 1, 1).data],
                };
            });

            expect(pixels.edge).toEqual([255, 0, 0, 255]);
            expect(pixels.outside).toEqual([0, 0, 0, 0]);
        });

        test('erases at the transformed position and restores drawing styles', async ({ page }) => {
            const pixels = await page.evaluate(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 30, 30);

                context.background('#ff0000').translate(5, 7).noStroke().fill('#0000ff');
                context.erase((path) => path.rect(0, 0, 4, 4));
                context.rect(10, 0, 4, 4);

                return {
                    erased: [...context.getImage(6, 8, 1, 1).data],
                    untouched: [...context.getImage(1, 1, 1, 1).data],
                    nextDrawing: [...context.getImage(16, 8, 1, 1).data],
                };
            });

            expect(pixels.erased).toEqual([0, 0, 0, 0]);
            expect(pixels.untouched).toEqual([255, 0, 0, 255]);
            expect(pixels.nextDrawing).toEqual([0, 0, 255, 255]);
        });
    });

    test.describe('images', () => {
        test('copies image data independently of the active transform', async ({ page }) => {
            const context = await page.evaluateHandle(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 30, 30);

                context.noStroke().fill('#ff0000').rect(0, 0, 4, 4);

                const image = context.getImage(0, 0, 4, 4);

                context.clear().translate(10, 10).putImage(image, 2, 3);

                return context;
            });

            expect(await context.evaluate((context) => [...context.getImage(3, 4, 1, 1).data])).toEqual([255, 0, 0, 255]);
            expect(await context.evaluate((context) => [...context.getImage(6, 4, 1, 1).data])).toEqual([0, 0, 0, 0]);
            expect(await context.evaluate((context) => [...context.getImage(13, 14, 1, 1).data])).toEqual([0, 0, 0, 0]);
        });

        test('copies only the dirty region of image data', async ({ page }) => {
            const context = await page.evaluateHandle(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 20, 20);

                context.background('#ff0000');

                const image = context.getImage(0, 0, 8, 8);

                context.clear().putImage(image, 2, 3, 2, 2, 3, 3);

                return context;
            });

            expect(await context.evaluate((context) => [...context.getImage(4, 5, 1, 1).data])).toEqual([255, 0, 0, 255]);
            expect(await context.evaluate((context) => [...context.getImage(3, 5, 1, 1).data])).toEqual([0, 0, 0, 0]);
            expect(await context.evaluate((context) => [...context.getImage(7, 5, 1, 1).data])).toEqual([0, 0, 0, 0]);
        });

        test('draws a canvas image at the requested offset', async ({ page }) => {
            const context = await page.evaluateHandle(() => {
                const source = document.createElement('canvas');
                const image = new F5.CanvasContext(source, 4, 4);
                const context = new F5.CanvasContext(document.getElementById('canvas'), 20, 20);

                image.background('#0000ff');
                context.drawImage(source, 5, 7);

                return context;
            });

            expect(await context.evaluate((context) => [...context.getImage(6, 8, 1, 1).data])).toEqual([0, 0, 255, 255]);
            expect(await context.evaluate((context) => [...context.getImage(4, 8, 1, 1).data])).toEqual([0, 0, 0, 0]);
        });
    });

    test.describe('text', () => {
        test('applies font settings when stroking text without a fill', async ({ page }) => {
            await page.evaluate(() => {
                const context = new F5.CanvasContext(document.getElementById('canvas'), 200, 100);

                context.noFill().stroke('#ff0000').font('serif').fontSize(24).fontWeight('bold')
                    .text('Hello', 10, 40);
            });

            const canvas = page.locator('#canvas');

            expect(await canvas.evaluate((node) => node.getContext('2d').font)).toBe('bold 24px serif');
            expect(await canvas.evaluate((node) => {
                return node.getContext('2d').getImageData(0, 0, 200, 100).data.some((value) => value !== 0);
            })).toBe(true);
        });

        test('applies default and custom text alignment to the native context', async ({ page }) => {
            const result = await page.evaluate(() => {
                const node = document.getElementById('canvas');
                const context = new F5.CanvasContext(node, 200, 100, {
                    fillStyle: '#000',
                    strokeStyle: null,
                });
                const native = node.getContext('2d');

                context.text('Hello', 2, 30);

                const defaultAlign = native.textAlign;
                const defaultBaseline = native.textBaseline;

                context.textAlign('center').textBaseline('middle').text('World', 100, 50);

                return {
                    defaultAlign,
                    defaultBaseline,
                    align: native.textAlign,
                    baseline: native.textBaseline,
                    painted: native.getImageData(0, 0, 200, 100).data.some((value) => value !== 0),
                };
            });

            expect(result.defaultAlign).toBe('start');
            expect(result.defaultBaseline).toBe('alphabetic');
            expect(result.align).toBe('center');
            expect(result.baseline).toBe('middle');
            expect(result.painted).toBe(true);
        });
    });
});
