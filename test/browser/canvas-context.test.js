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
    });
});
