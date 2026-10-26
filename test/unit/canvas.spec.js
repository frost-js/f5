import Canvas from './../../src/canvas.js';
import { expect, test } from './../support/unit.js';

test.describe('Canvas Unit', () => {
    test('requires a canvas-like node', ({ animationWindow }) => {
        expect(() => new Canvas({}, 600, 400, {
            runtime: animationWindow,
        })).toThrow('Canvas requires a canvas element.');
    });

    test('uses the injected runtime for delta and elapsed time', ({ animationWindow, canvasNode }) => {
        const node = canvasNode();

        animationWindow.setNow(1000);

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

        const sketch = new Sketch(node, 600, 400, {
            runtime: animationWindow,
        });

        animationWindow.advanceTime(16);
        animationWindow.runFrame(1);

        expect(sketch.calls).toEqual([
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

    test('releases mouse buttons independently', ({ animationWindow, canvasNode }) => {
        const node = canvasNode();

        class Sketch extends Canvas {
            onMouseUp(button) {
                this.events.mouseUp.push(button);
            }

            setup() {
                this.events = {
                    mouseUp: [],
                };
                this.noLoop();
            }
        }

        const sketch = new Sketch(node, 600, 400, {
            runtime: animationWindow,
        });

        node.dispatch('mouseenter', {
            offsetX: 5,
            offsetY: 6,
        });
        node.dispatch('mousedown', {
            button: 0,
            offsetX: 5,
            offsetY: 6,
        });
        node.dispatch('mousedown', {
            button: 2,
            offsetX: 5,
            offsetY: 6,
        });

        animationWindow.dispatch('mouseup', {
            button: 0,
            clientX: 15,
            clientY: 26,
        });

        expect(sketch.isMousePressed(0)).toBe(false);
        expect(sketch.isMousePressed(2)).toBe(true);
        expect(sketch.events.mouseUp).toEqual([0]);
    });

    test('releases keys independently and ignores repeated keydown listeners', ({
        animationWindow,
        canvasNode,
    }) => {
        const node = canvasNode();

        class Sketch extends Canvas {
            onKeyPress(key) {
                this.events.keyPress.push(key);
            }

            onKeyUp(code) {
                this.events.keyUp.push(code);
            }

            setup() {
                this.events = {
                    keyPress: [],
                    keyUp: [],
                };
                this.noLoop();
            }
        }

        const sketch = new Sketch(node, 600, 400, {
            runtime: animationWindow,
        });

        node.dispatch('keydown', {
            code: 'KeyA',
            key: 'a',
        });
        node.dispatch('keydown', {
            code: 'KeyA',
            key: 'a',
            repeat: true,
        });
        node.dispatch('keydown', {
            code: 'KeyB',
            key: 'b',
        });

        animationWindow.dispatch('keyup', {
            code: 'KeyA',
        });
        animationWindow.dispatch('keyup', {
            code: 'KeyA',
        });

        expect(sketch.isKeyPressed('KeyA')).toBe(false);
        expect(sketch.isKeyPressed('KeyB')).toBe(true);
        expect(sketch.events.keyPress).toEqual(['a', 'b']);
        expect(sketch.events.keyUp).toEqual(['KeyA']);
    });

    test('stops scheduled frames immediately when noLoop is called', ({
        animationWindow,
        canvasNode,
    }) => {
        const node = canvasNode();

        class Sketch extends Canvas {
            setup() {
                this.calls = 0;
            }

            update() {
                this.calls += 1;
            }
        }

        const sketch = new Sketch(node, 600, 400, {
            runtime: animationWindow,
        });

        expect(sketch.calls).toBe(1);

        sketch.noLoop();
        animationWindow.runFrame(1);

        expect(sketch.calls).toBe(1);
    });

    test('destroys listeners and clears input state', ({ animationWindow, canvasNode }) => {
        const node = canvasNode();

        class Sketch extends Canvas {
            onKeyUp(code) {
                this.events.keyUp.push(code);
            }

            onMouseUp(button) {
                this.events.mouseUp.push(button);
            }

            setup() {
                this.events = {
                    keyUp: [],
                    mouseUp: [],
                };
                this.noLoop();
            }
        }

        const sketch = new Sketch(node, 600, 400, {
            runtime: animationWindow,
        });

        node.dispatch('mouseenter', {
            offsetX: 5,
            offsetY: 6,
        });
        node.dispatch('mousedown', {
            button: 0,
            offsetX: 5,
            offsetY: 6,
        });
        node.dispatch('keydown', {
            code: 'KeyA',
            key: 'a',
        });

        sketch.destroy();

        animationWindow.dispatch('mouseup', {
            button: 0,
            clientX: 15,
            clientY: 26,
        });
        animationWindow.dispatch('keyup', {
            code: 'KeyA',
        });

        expect(sketch.isMousePressed()).toBe(false);
        expect(sketch.isKeyPressed()).toBe(false);
        expect(sketch.mousePos()).toBeNull();
        expect(sketch.events.mouseUp).toEqual([]);
        expect(sketch.events.keyUp).toEqual([]);
    });
});
