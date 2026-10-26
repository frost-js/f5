import { expect, test } from '#test';
import { setupCanvas } from '../setup/canvas.js';

test.describe('Canvas animation', () => {
    test.beforeEach(setupCanvas);

    test.use({ mockClock: true });

    test.describe('timing', () => {
        test('passes delta and elapsed time to update using a real canvas node', async ({ page }) => {
            const calls = await page.evaluate(() => {
                const { Canvas } = window.F5;
                const timestamps = [1000, 1016];
                const animationFrames = [];
                const runtime = {
                    cancelAnimationFrame() {},
                    eventTarget: window,
                    now() {
                        return timestamps.length ?
                            timestamps.shift() :
                            1016;
                    },
                    requestAnimationFrame(callback) {
                        animationFrames.push(callback);

                        return animationFrames.length;
                    },
                };

                class Sketch extends Canvas {
                    setup() {
                        this.calls = [];
                    }

                    update(deltaTime, elapsedTime) {
                        this.calls.push({
                            deltaTime,
                            elapsedTime,
                        });

                        if (this.calls.length === 2) {
                            this.noLoop();
                        }
                    }
                }

                try {
                    window.sketch = new Sketch(document.getElementById('canvas'), 600, 400, {
                        runtime,
                    });
                    window.sketch.start();

                    animationFrames[0]();

                    return window.sketch.calls;
                } finally {
                    window.sketch?.dispose();
                    delete window.sketch;
                }
            });

            expect(calls).toEqual([
                {
                    deltaTime: 0,
                    elapsedTime: 0,
                },
                {
                    deltaTime: 0.016,
                    elapsedTime: 0.016,
                },
            ]);
        });
    });

    test.describe('cancellation', () => {
        test('dispose stops browser animation and releases input listeners', async ({ page }) => {
            await page.evaluate(() => {
                class Sketch extends F5.Canvas {
                    onKeyDown() {
                        this.keyDowns++;
                    }

                    setup() {
                        this.frames = 0;
                        this.keyDowns = 0;
                    }

                    update() {
                        this.frames++;
                    }
                }

                window.sketch = new Sketch(document.getElementById('canvas'));
                window.sketch.start();
            });
            await page.clock.runFor(50);
            await page.locator('#canvas').focus();
            await page.keyboard.down('a');
            const before = await page.evaluate(() => {
                const frames = window.sketch.frames;
                window.sketch.dispose();
                window.sketch.dispose();
                return frames;
            });
            expect(before).toBeGreaterThan(1);
            await page.clock.runFor(100);
            await page.keyboard.up('a');
            await page.keyboard.press('b');
            const state = await page.evaluate(() => ({
                frames: window.sketch.frames,
                keyDowns: window.sketch.keyDowns,
                pressed: window.sketch.isKeyPressed(),
            }));

            expect(state.frames).toBe(before);
            expect(state.keyDowns).toBe(1);
            expect(state.pressed).toBe(false);
        });
    });
});
