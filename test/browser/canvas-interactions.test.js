import { expect, test } from '#test';
import { setupCanvas } from '../setup/canvas.js';

test.describe('Canvas interactions', () => {
    test.beforeEach(setupCanvas);

    test.beforeEach(async ({ page }) => {
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
    });

    test.describe('mouse', () => {
        test('tracks pointer position, buttons, and clicks', async ({ page }) => {
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
            expect(hoveredState.events.mouseMove.x).toBe(20);
            expect(hoveredState.events.mouseMove.y).toBe(25);
            expect(hoveredState.isMousePressed).toBe(false);
            expect(hoveredState.mousePos?.x).toBe(20);
            expect(hoveredState.mousePos?.y).toBe(25);

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

            expect(await page.evaluate(() => window.sketch.events.mouseClick)).toEqual([0, 0]);
        });

        test('maps CSS-scaled mouse positions and outside releases to drawing coordinates', async ({ page }) => {
            const canvas = page.locator('#root canvas');

            await canvas.evaluate((node) => {
                node.style.width = '100px';
                node.style.height = '60px';
            });
            await canvas.hover({ position: { x: 20, y: 15 } });

            const position = await page.evaluate(() => window.sketch.events.mouseMove);

            expect(position.x).toBeCloseTo(40);
            expect(position.y).toBeCloseTo(30);

            await page.mouse.down();

            const bounds = await canvas.boundingBox();

            await page.mouse.move(bounds.x + bounds.width + 10, bounds.y + 10);
            await page.mouse.up();

            const released = await page.evaluate(() => ({
                position: window.sketch.mousePos(),
                pressed: window.sketch.isMousePressed(),
                buttons: window.sketch.events.mouseUp,
            }));

            expect(released.position.x).toBeCloseTo(220);
            expect(released.position.y).toBeCloseTo(20);
            expect(released.pressed).toBe(false);
            expect(released.buttons).toEqual([0]);
        });

        test('ignores mouse coordinates when the canvas has no displayed size', async ({ page }) => {
            await page.locator('#root canvas').evaluate((node) => {
                node.style.display = 'none';
                node.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 30 }));
            });

            expect(await page.evaluate(() => window.sketch.mousePos())).toBeNull();
            expect(await page.evaluate(() => window.sketch.events.mouseMove)).toBeNull();
        });
    });

    test.describe('keyboard', () => {
        test('tracks pressed keys and keyboard callbacks', async ({ page }) => {
            await page.locator('#root canvas').focus();

            await page.keyboard.down('a');

            const keyDownState = await page.evaluate(() => ({
                anyPressed: window.sketch.isKeyPressed(),
                keyA: window.sketch.isKeyPressed('KeyA'),
                keyDown: window.sketch.events.keyDown,
                keyPress: window.sketch.events.keyPress,
            }));

            expect(keyDownState.anyPressed).toBe(true);
            expect(keyDownState.keyA).toBe(true);
            expect(keyDownState.keyDown).toContain('KeyA');
            expect(keyDownState.keyPress).toContain('a');

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
});
