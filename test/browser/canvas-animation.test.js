import { expect, test } from '#test';
import { setupCanvas } from '../setup/canvas.js';

test.describe('Canvas animation', () => {
    test.beforeEach(setupCanvas);

    test.use({ mockClock: true });

    test.describe('startup', () => {
        test('waits for start and calls setup only once', async ({ page }) => {
            await page.evaluate(() => {
                class Sketch extends F5.Canvas {
                    frames = 0;
                    setups = 0;

                    setup() {
                        this.setups++;
                        this.start();
                    }

                    update() {
                        this.frames++;
                    }
                }

                window.sketch = new Sketch(document.getElementById('canvas'));
            });
            await page.clock.runFor(50);

            expect(await page.evaluate(() => window.sketch.setups)).toBe(0);
            expect(await page.evaluate(() => window.sketch.frames)).toBe(0);

            await page.evaluate(() => {
                window.sketch.start();
                window.sketch.start();
            });

            expect(await page.evaluate(() => window.sketch.setups)).toBe(1);
            expect(await page.evaluate(() => window.sketch.frames)).toBe(1);

            await page.clock.runFor(50);

            expect(await page.evaluate(() => window.sketch.setups)).toBe(1);
            expect(await page.evaluate(() => window.sketch.frames)).toBeGreaterThan(1);
        });

        test('supports static sketches that stop in setup and still receive input', async ({ page }) => {
            await page.evaluate(() => {
                class Sketch extends F5.Canvas {
                    frames = 0;

                    setup() {
                        this.noLoop();
                        this.context.background('#ff0000');
                    }

                    update() {
                        this.frames++;
                    }
                }

                window.sketch = Sketch.attach(document.getElementById('root'));
            });
            await page.clock.runFor(50);
            await page.locator('#root canvas').focus();
            await page.keyboard.down('a');

            expect(await page.evaluate(() => window.sketch.frames)).toBe(0);
            expect(await page.evaluate(() => window.sketch.isKeyPressed('KeyA'))).toBe(true);
            expect(await page.evaluate(() => [...window.sketch.context.getImage(1, 1, 1, 1).data]))
                .toEqual([255, 0, 0, 255]);

            await page.keyboard.up('a');

            expect(await page.evaluate(() => window.sketch.isKeyPressed())).toBe(false);
        });

        test('does not start a sketch disposed before startup', async ({ page }) => {
            await page.evaluate(() => {
                class Sketch extends F5.Canvas {
                    frames = 0;
                    setups = 0;

                    setup() {
                        this.setups++;
                    }

                    update() {
                        this.frames++;
                    }
                }

                window.sketch = new Sketch(document.getElementById('canvas'));
                window.sketch.dispose();
                window.sketch.start();
            });
            await page.clock.runFor(50);
            await page.locator('#canvas').focus();
            await page.keyboard.down('a');

            expect(await page.evaluate(() => window.sketch.setups)).toBe(0);
            expect(await page.evaluate(() => window.sketch.frames)).toBe(0);
            expect(await page.evaluate(() => window.sketch.isKeyPressed())).toBe(false);

            await page.keyboard.up('a');
        });

        test('does not schedule updates when setup disposes the sketch', async ({ page }) => {
            await page.evaluate(() => {
                class Sketch extends F5.Canvas {
                    frames = 0;

                    setup() {
                        this.dispose();
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

            expect(await page.evaluate(() => window.sketch.frames)).toBe(0);
            expect(await page.evaluate(() => window.sketch.isKeyPressed())).toBe(false);

            await page.keyboard.up('a');
        });
    });

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
        test('noLoop cancels pending frames while preserving input', async ({ page }) => {
            await page.evaluate(() => {
                class Sketch extends F5.Canvas {
                    frames = 0;

                    update() {
                        this.frames++;
                    }
                }

                window.sketch = Sketch.attach(document.getElementById('root'));
            });
            await page.clock.runFor(50);
            await page.evaluate(() => window.sketch.noLoop());

            const stopped = await page.evaluate(() => window.sketch.frames);

            expect(stopped).toBeGreaterThan(1);

            await page.evaluate(() => window.sketch.start());
            await page.clock.runFor(100);
            await page.locator('#root canvas').focus();
            await page.keyboard.down('a');

            expect(await page.evaluate(() => window.sketch.frames)).toBe(stopped);
            expect(await page.evaluate(() => window.sketch.isKeyPressed('KeyA'))).toBe(true);

            await page.keyboard.up('a');
        });

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
