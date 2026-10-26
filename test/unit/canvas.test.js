import { expect, test } from '#unit';
import Canvas from '../../src/canvas.js';

test.describe('Canvas', () => {
    test.describe('constructor', () => {
        test('requires a canvas-like node', ({ animationWindow }) => {
            expect(() => new Canvas({}, 600, 400, {
                runtime: animationWindow,
            })).toThrow('Canvas requires a canvas element.');
        });
    });

    test.describe('#start', () => {
        test('waits for subclass initialization and starts only once', ({ animationWindow, canvasNode }) => {
            const node = canvasNode();

            class Sketch extends Canvas {
                frames = 0;
                setupCalls = 0;

                #value = 1;

                constructor(...args) {
                    super(...args);
                    this.#value = 7;
                }

                setup() {
                    this.setupCalls += 1;
                    this.setupValue = this.#value;
                    this.start();
                }

                update() {
                    this.frames += 1;
                    this.updateValue = this.#value;
                }
            }

            const sketch = new Sketch(node, 600, 400, { runtime: animationWindow });

            expect(sketch.setupCalls).toBe(0);
            expect(sketch.frames).toBe(0);
            expect(node.listenerCount()).toBe(0);
            expect(animationWindow.listenerCount()).toBe(0);

            expect(sketch.start()).toBe(sketch);

            const nodeListeners = node.listenerCount();
            const windowListeners = animationWindow.listenerCount();

            expect(sketch.start()).toBe(sketch);
            expect(sketch.setupCalls).toBe(1);
            expect(sketch.setupValue).toBe(7);
            expect(sketch.frames).toBe(1);
            expect(sketch.updateValue).toBe(7);
            expect(nodeListeners).toBeGreaterThan(0);
            expect(windowListeners).toBeGreaterThan(0);
            expect(node.listenerCount()).toBe(nodeListeners);
            expect(animationWindow.listenerCount()).toBe(windowListeners);

            animationWindow.runFrame(1);

            expect(sketch.frames).toBe(2);

            sketch.noLoop();
            sketch.start();
            animationWindow.runFrame(2);

            expect(sketch.frames).toBe(2);
            expect(sketch.setupCalls).toBe(1);

            sketch.dispose();
        });

        test('supports static sketches that stop the loop in setup', ({ animationWindow, canvasNode }) => {
            const node = canvasNode();

            class Sketch extends Canvas {
                frames = 0;

                setup() {
                    this.noLoop();
                }

                update() {
                    this.frames += 1;
                }
            }

            const sketch = new Sketch(node, 600, 400, { runtime: animationWindow });

            sketch.start();
            sketch.start();
            animationWindow.runFrame(1);
            node.dispatch('keydown', { code: 'KeyA', key: 'a' });

            expect(sketch.frames).toBe(0);
            expect(sketch.isKeyPressed('KeyA')).toBe(true);

            sketch.dispose();
        });

        test('does not start a sketch disposed before startup', ({ animationWindow, canvasNode }) => {
            const node = canvasNode();

            class Sketch extends Canvas {
                frames = 0;
                setupCalls = 0;

                setup() {
                    this.setupCalls += 1;
                }

                update() {
                    this.frames += 1;
                }
            }

            const sketch = new Sketch(node, 600, 400, { runtime: animationWindow });

            expect(sketch.dispose()).toBeUndefined();
            expect(sketch.dispose()).toBeUndefined();
            expect(sketch.start()).toBe(sketch);

            animationWindow.runFrame(1);

            expect(sketch.setupCalls).toBe(0);
            expect(sketch.frames).toBe(0);
            expect(node.listenerCount()).toBe(0);
            expect(animationWindow.listenerCount()).toBe(0);
        });

        test('stops startup when setup disposes the sketch', ({ animationWindow, canvasNode }) => {
            const node = canvasNode();

            class Sketch extends Canvas {
                frames = 0;

                setup() {
                    this.dispose();
                }

                update() {
                    this.frames += 1;
                }
            }

            const sketch = new Sketch(node, 600, 400, { runtime: animationWindow });

            sketch.start();
            sketch.start();
            animationWindow.runFrame(1);

            expect(sketch.frames).toBe(0);
            expect(node.listenerCount()).toBe(0);
            expect(animationWindow.listenerCount()).toBe(0);
        });
    });

    test.describe('startup failures', () => {
        for (const hook of ['setup', 'update']) {
            test(`removes listeners when ${hook} throws`, ({ animationWindow, canvasNode }) => {
                const node = canvasNode();
                const error = new Error(`${hook} failed`);

                class Sketch extends Canvas {
                    [hook]() {
                        throw error;
                    }
                }

                const sketch = new Sketch(node, 600, 400, {
                    runtime: animationWindow,
                });

                expect(() => sketch.start()).toThrow(error);
                expect(sketch.start()).toBe(sketch);
                expect(node.listenerCount()).toBe(0);
                expect(animationWindow.listenerCount()).toBe(0);
            });
        }
    });

    test.describe('animation', () => {
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

            sketch.start();

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

        test('uses the owning window for default scheduling, timing, and global input', ({
            animationWindow,
            canvasNode,
        }) => {
            const node = canvasNode(undefined, {
                ownerDocument: {
                    defaultView: animationWindow,
                },
            });

            class Sketch extends Canvas {
                setup() {
                    this.calls = [];
                }

                update(deltaTime) {
                    this.calls.push(deltaTime);
                }
            }

            const sketch = new Sketch(node);

            try {
                sketch.start();
                animationWindow.advanceTime(16);
                animationWindow.runFrame(1);

                expect(sketch.calls).toEqual([0, 0.016]);

                node.dispatch('keydown', { code: 'KeyA', key: 'a' });

                expect(sketch.isKeyPressed('KeyA')).toBe(true);

                animationWindow.dispatch('keyup', { code: 'KeyA' });

                expect(sketch.isKeyPressed('KeyA')).toBe(false);
            } finally {
                sketch.dispose();
            }

            animationWindow.runFrame(2);

            expect(sketch.calls).toEqual([0, 0.016]);
            expect(animationWindow.listenerCount()).toBe(0);
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

            sketch.start();

            expect(sketch.calls).toBe(1);

            sketch.noLoop();
            animationWindow.runFrame(1);

            expect(sketch.calls).toBe(1);
        });
    });

    test.describe('input', () => {
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

            sketch.start();

            node.dispatch('mouseenter', {
                clientX: 15,
                clientY: 26,
            });
            node.dispatch('mousedown', {
                button: 0,
                clientX: 15,
                clientY: 26,
            });
            node.dispatch('mousedown', {
                button: 2,
                clientX: 15,
                clientY: 26,
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

            sketch.start();

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
    });

    test.describe('#dispose', () => {
        test('removes listeners and clears input state', ({ animationWindow, canvasNode }) => {
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

            sketch.start();

            node.dispatch('mouseenter', {
                clientX: 15,
                clientY: 26,
            });
            node.dispatch('mousedown', {
                button: 0,
                clientX: 15,
                clientY: 26,
            });
            node.dispatch('keydown', {
                code: 'KeyA',
                key: 'a',
            });

            sketch.dispose();

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
});
