import { expect, test } from '@playwright/test';
import { gotoSourceHarness } from './harness.js';

test.describe('Path And Shape Browser Integration', () => {
    test.beforeEach(async ({ page }) => {
        await gotoSourceHarness(page);
    });

    test('computes path bounds, containment, and render size', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { Path } = window.F5;
            const canvas = document.getElementById('canvas');
            const context = canvas.getContext('2d');
            const path = new Path(context);

            path.rect(10, 20, 30, 40);

            const rendered = path.render({
                fillStyle: '#ff0000',
                lineWidth: 0,
            });

            return {
                bounds: path.getBoundingBox(),
                containsInside: path.containsPoint(15, 25),
                containsOutside: path.containsPoint(5, 10),
                renderHeight: Number(rendered.getAttribute('height')),
                renderWidth: Number(rendered.getAttribute('width')),
            };
        });

        expect(result.bounds).toEqual({
            bottom: 60,
            height: 40,
            left: 10,
            right: 40,
            top: 20,
            width: 30,
            x: 10,
            y: 20,
        });
        expect(result.containsInside).toBe(true);
        expect(result.containsOutside).toBe(false);
        expect(result.renderWidth).toBe(30);
        expect(result.renderHeight).toBe(40);
    });

    test('does not clip large arc-to curves', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { Path } = window.F5;
            const canvas = document.getElementById('canvas');
            const path = new Path(canvas.getContext('2d'));

            path.curve(0, 0, 10, 0, 10, 10, 100);

            const rendered = path.render({
                lineWidth: 1,
                strokeStyle: '#000',
            });

            return {
                bounds: path.getBoundingBox(),
                height: rendered.height,
                width: rendered.width,
            };
        });

        expect(result.bounds.left).toBeCloseTo(-90);
        expect(result.bounds.bottom).toBeCloseTo(100);
        expect(result.width).toBeGreaterThanOrEqual(101);
        expect(result.height).toBeGreaterThanOrEqual(101);
    });

    test('supports contours and rotated shape bounds', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { Shape } = window.F5;
            const canvas = document.getElementById('canvas');
            const context = canvas.getContext('2d');

            const contourShape = new Shape(context, 10, 10)
                .layer((path) => {
                    path.rect(0, 0, 40, 40);
                })
                .contour((path) => {
                    path.rect(10, 10, 20, 20);
                });

            const rotatedShape = new Shape(context, 0, 0, Math.PI / 2)
                .layer((path) => {
                    path.rect(0, 0, 10, 20);
                });

            return {
                hole: contourShape.containsPoint(30, 30),
                outer: contourShape.containsPoint(15, 15),
                outside: contourShape.containsPoint(60, 60),
                rotatedBounds: rotatedShape.getBoundingBox(),
            };
        });

        expect(result.outer).toBe(true);
        expect(result.hole).toBe(false);
        expect(result.outside).toBe(false);
        expect(result.rotatedBounds.left).toBeCloseTo(-20);
        expect(result.rotatedBounds.top).toBeCloseTo(0);
        expect(result.rotatedBounds.width).toBeCloseTo(20);
        expect(result.rotatedBounds.height).toBeCloseTo(10);
    });
});
