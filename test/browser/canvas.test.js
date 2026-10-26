import { expect, test } from '#test';

test.describe('Canvas Browser Integration', () => {
    test('destroy stops browser animation and releases input listeners', async ({ page }) => {
        await page.clock.install({ time: 0 });
        await page.clock.pauseAt(1000);
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
        });
        await page.clock.runFor(50);
        await page.locator('#canvas').focus();
        await page.keyboard.down('a');
        const before = await page.evaluate(() => {
            const frames = window.sketch.frames;
            window.sketch.destroy();
            window.sketch.destroy();
            return frames;
        });
        expect(before).toBeGreaterThan(1);
        await page.clock.runFor(100);
        await page.keyboard.up('a');
        await page.keyboard.press('b');
        expect(await page.evaluate(() => ({
            frames: window.sketch.frames,
            keyDowns: window.sketch.keyDowns,
            pressed: window.sketch.isKeyPressed(),
        }))).toEqual({ frames: before, keyDowns: 1, pressed: false });
    });

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

                animationFrames[0]();

                return window.sketch.calls;
            } finally {
                window.sketch?.destroy();
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

    test('attaches a canvas to a parent element', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { Canvas } = window.F5;

            class Sketch extends Canvas {
                setup() {
                    this.noLoop();
                }
            }

            window.sketch = Sketch.attach(document.getElementById('root'), 240, 120);

            const canvas = document.querySelector('#root canvas');

            return {
                height: canvas.getAttribute('height'),
                tagName: canvas.tagName,
                tabIndex: canvas.getAttribute('tabindex'),
                width: canvas.getAttribute('width'),
            };
        });

        expect(result).toEqual({
            height: '120',
            tagName: 'CANVAS',
            tabIndex: '1',
            width: '240',
        });
    });

    test('tracks mouse and keyboard state through real browser events', async ({ page }) => {
        await page.evaluate(() => {
            const { Canvas } = window.F5;

            class Sketch extends Canvas {
                onKeyDown(code) {
                    this.events.keyDown.push(code);
                }

                onKeyPress(code) {
                    this.events.keyPress.push(code);
                }

                onKeyUp(code) {
                    this.events.keyUp.push(code);
                }

                onMouseClick(button) {
                    this.events.mouseClick.push(button);
                }

                onMouseDown(button) {
                    this.events.mouseDown.push(button);
                }

                onMouseEnter() {
                    this.events.mouseEnter += 1;
                }

                onMouseLeave() {
                    this.events.mouseLeave += 1;
                }

                onMouseMove(x, y) {
                    this.events.mouseMove = { x, y };
                }

                onMouseUp(button) {
                    this.events.mouseUp.push(button);
                }

                setup() {
                    this.events = {
                        keyPress: [],
                        keyDown: [],
                        keyUp: [],
                        mouseClick: [],
                        mouseDown: [],
                        mouseEnter: 0,
                        mouseLeave: 0,
                        mouseMove: null,
                        mouseUp: [],
                    };
                    this.noLoop();
                }
            }

            window.sketch = Sketch.attach(document.getElementById('root'), 200, 120);
        });

        const canvas = page.locator('#root canvas');

        await canvas.hover({
            position: {
                x: 20,
                y: 25,
            },
        });

        const hoveredState = await page.evaluate(() => {
            const mousePos = window.sketch.mousePos();

            return {
                events: window.sketch.events,
                isMousePressed: window.sketch.isMousePressed(),
                mousePos: mousePos ? { x: mousePos.x, y: mousePos.y } : null,
            };
        });

        expect(hoveredState.events.mouseEnter).toBe(1);
        expect(hoveredState.events.mouseMove).toEqual({
            x: 20,
            y: 25,
        });
        expect(hoveredState.isMousePressed).toBe(false);
        expect(hoveredState.mousePos).toEqual({
            x: 20,
            y: 25,
        });

        await page.mouse.down();

        const pressedState = await page.evaluate(() => ({
            isMousePressed: window.sketch.isMousePressed(),
            mouseDown: window.sketch.events.mouseDown,
        }));

        expect(pressedState.isMousePressed).toBe(true);
        expect(pressedState.mouseDown).toEqual([0]);

        await page.mouse.up();
        await page.mouse.move(400, 400);

        const releasedState = await page.evaluate(() => {
            const mousePos = window.sketch.mousePos();

            return {
                isMousePressed: window.sketch.isMousePressed(),
                mouseLeave: window.sketch.events.mouseLeave,
                mousePos: mousePos ? { x: mousePos.x, y: mousePos.y } : null,
                mouseUp: window.sketch.events.mouseUp,
            };
        });

        expect(releasedState.isMousePressed).toBe(false);
        expect(releasedState.mouseLeave).toBe(1);
        expect(releasedState.mousePos).toBeNull();
        expect(releasedState.mouseUp).toEqual([0]);

        await canvas.click({
            position: {
                x: 30,
                y: 35,
            },
        });
        await page.keyboard.down('a');

        const keyDownState = await page.evaluate(() => ({
            anyPressed: window.sketch.isKeyPressed(),
            keyA: window.sketch.isKeyPressed('KeyA'),
            keyDown: window.sketch.events.keyDown,
            keyPress: window.sketch.events.keyPress,
            mouseClick: window.sketch.events.mouseClick,
        }));

        expect(keyDownState.anyPressed).toBe(true);
        expect(keyDownState.keyA).toBe(true);
        expect(keyDownState.keyDown).toContain('KeyA');
        expect(keyDownState.keyPress).toContain('a');
        expect(keyDownState.mouseClick).toEqual([0, 0]);

        await page.keyboard.up('a');

        const keyUpState = await page.evaluate(() => ({
            anyPressed: window.sketch.isKeyPressed(),
            keyA: window.sketch.isKeyPressed('KeyA'),
            keyUp: window.sketch.events.keyUp,
        }));

        expect(keyUpState.anyPressed).toBe(false);
        expect(keyUpState.keyA).toBe(false);
        expect(keyUpState.keyUp).toContain('KeyA');
    });
});
