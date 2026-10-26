import { expect, test } from '#test';
import { setupCanvas } from '../setup/canvas.js';

test.describe('Canvas animation', () => {
    test.beforeEach(setupCanvas);

    test.use({ mockClock: true });

    test.describe('timing', () => {
        test('uses the browser clock for delta and elapsed time', async ({ page }) => {
            await page.evaluate(() => {
                class Sketch extends F5.Canvas {
                    calls = [];

                    update(deltaTime, elapsedTime) {
                        this.calls.push({ deltaTime, elapsedTime, time: performance.now() });
                    }
                }

                window.sketch = new Sketch(document.getElementById('canvas'));
                window.sketch.start();
            });

            await page.clock.runFor(50);

            const calls = await page.evaluate(() => window.sketch.calls);

            expect(calls.length).toBeGreaterThan(1);
            expect(calls[0].deltaTime).toBe(0);
            expect(calls[0].elapsedTime).toBe(0);

            for (let index = 1; index < calls.length; index++) {
                const call = calls[index];

                expect(call.deltaTime).toBeGreaterThan(0);
                expect(call.deltaTime).toBeCloseTo((call.time - calls[index - 1].time) / 1000);
                expect(call.elapsedTime).toBeCloseTo((call.time - calls[0].time) / 1000);
            }
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
