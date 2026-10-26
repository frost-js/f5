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
            await expect(canvas).toHaveAttribute('tabindex', '1');
        });
    });
});
