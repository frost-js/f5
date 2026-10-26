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

    test.describe('drawing', () => {
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

    test.describe('text', () => {
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
