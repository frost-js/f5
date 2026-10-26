import { expect, test } from '#test';
import { setupCanvas } from '../setup/canvas.js';

test.describe('Canvas', () => {
    test.beforeEach(setupCanvas);

    test.describe('#attach', () => {
        test('attaches a canvas to a parent element', async ({ page }) => {
            await page.evaluate(() => {
                const { Canvas } = window.F5;

                class Sketch extends Canvas {
                    setup() {
                        this.noLoop();
                    }
                }

                window.sketch = Sketch.attach(document.getElementById('root'), 240, 120);
            });

            const canvas = page.locator('#root canvas');

            await expect(canvas).toHaveCount(1);
            await expect(canvas).toHaveAttribute('width', '240');
            await expect(canvas).toHaveAttribute('height', '120');
            await expect(canvas).toHaveAttribute('tabindex', '0');
        });

        test('starts after subclass fields and constructor state are initialized', async ({ page }) => {
            const values = await page.evaluate(() => {
                class Sketch extends F5.Canvas {
                    frames = 0;

                    #value = 1;

                    constructor(...args) {
                        super(...args);
                        this.#value = 7;
                    }

                    setup() {
                        this.setupValue = this.#value;
                    }

                    update() {
                        this.frames += 1;
                        this.updateValue = this.#value;
                        this.noLoop();
                    }
                }

                window.sketch = Sketch.attach(document.getElementById('root'));

                return {
                    setup: window.sketch.setupValue,
                    update: window.sketch.updateValue,
                    frames: window.sketch.frames,
                };
            });

            expect(values.setup).toBe(7);
            expect(values.update).toBe(7);
            expect(values.frames).toBe(1);
        });

        for (const hook of ['setup', 'update']) {
            test(`removes the generated canvas when ${hook} throws`, async ({ page }) => {
                const message = await page.evaluate((hook) => {
                    class Sketch extends F5.Canvas {
                        [hook]() {
                            throw new Error(`${hook} failed`);
                        }
                    }

                    try {
                        Sketch.attach(document.getElementById('root'));
                    } catch (error) {
                        return error.message;
                    }
                }, hook);

                expect(message).toBe(`${hook} failed`);
                await expect(page.locator('#root canvas')).toHaveCount(0);
            });
        }

        test('creates the canvas, paths, and rendered layers in the owning document', async ({ page }) => {
            const result = await page.evaluate(() => {
                const frame = document.createElement('iframe');

                document.getElementById('root').append(frame);

                const ownerDocument = frame.contentDocument;
                const view = frame.contentWindow;
                const NativePath = view.Path2D;
                let paths = 0;

                view.Path2D = class extends NativePath {
                    constructor() {
                        super();
                        paths += 1;
                    }
                };

                class Sketch extends F5.Canvas {
                    setup() {
                        this.noLoop();
                    }
                }

                window.sketch = Sketch.attach(ownerDocument.body, 200, 120);

                const path = window.sketch.context.createPath().rect(0, 0, 10, 10);
                const shape = window.sketch.context.createShape().layer((layer) => {
                    layer.rect(0, 0, 10, 10);
                });

                return {
                    canvas: ownerDocument.querySelector('canvas').ownerDocument === ownerDocument,
                    path: path.render({ fillStyle: '#000' }).ownerDocument === ownerDocument,
                    shape: shape.render({ fillStyle: '#000' }).ownerDocument === ownerDocument,
                    paths,
                };
            });

            expect(result.canvas).toBe(true);
            expect(result.path).toBe(true);
            expect(result.shape).toBe(true);
            expect(result.paths).toBe(2);
        });
    });

    test.describe('existing canvases', () => {
        test('preserves caller tab order and focus styles', async ({ page }) => {
            await page.evaluate(() => {
                const node = document.getElementById('canvas');

                node.tabIndex = -1;
                node.style.outline = '3px solid rgb(255, 0, 0)';

                class Sketch extends F5.Canvas {
                    setup() {
                        this.noLoop();
                    }
                }

                window.sketch = new Sketch(node);
                window.sketch.start();
            });

            const canvas = page.locator('#canvas');

            await expect(canvas).toHaveAttribute('tabindex', '-1');
            await expect(canvas).toHaveCSS('outline-width', '3px');
            await expect(canvas).toHaveCSS('outline-style', 'solid');
            await expect(canvas).toHaveCSS('outline-color', 'rgb(255, 0, 0)');
        });

        test('keeps the caller canvas when startup fails', async ({ page }) => {
            const message = await page.evaluate(() => {
                class Sketch extends F5.Canvas {
                    setup() {
                        throw new Error('Setup failed');
                    }
                }

                try {
                    new Sketch(document.getElementById('canvas')).start();
                } catch (error) {
                    return error.message;
                }
            });

            expect(message).toBe('Setup failed');
            await expect(page.locator('#canvas')).toHaveCount(1);
        });
    });
});
