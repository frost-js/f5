import { expect, test } from '#unit';
import Path from '../../src/path.js';

test.describe('Path', () => {
    test.describe('constructor', () => {
        test('requires a hit-test capable context', () => {
            expect(() => new Path({})).toThrow('Path requires a 2D canvas context.');
        });
    });

    test.describe('#getBoundingBox', () => {
        test('returns a zero-sized bounding box when empty', ({ hitTestContext }) => {
            const path = new Path(hitTestContext());

            expect(path.getBoundingBox()).toEqual({
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            });
        });

        test('accounts for ellipse rotation in the bounding box', ({ hitTestContext }) => {
            const path = new Path(hitTestContext());

            path.ellipse(0, 0, 20, 10, Math.PI / 2);

            const bounds = path.getBoundingBox();

            expect(bounds.left).toBeCloseTo(-5);
            expect(bounds.right).toBeCloseTo(5);
            expect(bounds.top).toBeCloseTo(-10);
            expect(bounds.bottom).toBeCloseTo(10);
            expect(bounds.width).toBeCloseTo(10);
            expect(bounds.height).toBeCloseTo(20);
        });

        test('bounds partial arcs using the drawn sweep instead of the full circle', ({ hitTestContext }) => {
            const path = new Path(hitTestContext());

            path.arc(0, 0, 10, 0, Math.PI);

            expect(path.getBoundingBox()).toEqual({
                top: 0,
                right: 10,
                bottom: 10,
                left: -10,
                x: -10,
                y: 0,
                width: 20,
                height: 10,
            });
        });

        test('tracks an arc subpath from its start after closing', ({ hitTestContext }) => {
            const path = new Path(hitTestContext());

            path.arc(0, 0, 10, 0, Math.PI / 2)
                .close()
                .quadraticVertex(20, 0, 10, 10);

            expect(path.getBoundingBox().right).toBeCloseTo(15);
        });

        test('tracks quadratic curve extrema from the current point', ({ hitTestContext }) => {
            const path = new Path(hitTestContext());

            path.vertex(0, 0).quadraticVertex(10, 20, 20, 0);

            const bounds = path.getBoundingBox();

            expect(bounds.left).toBe(0);
            expect(bounds.right).toBe(20);
            expect(bounds.top).toBe(0);
            expect(bounds.bottom).toBeCloseTo(10);
            expect(bounds.width).toBe(20);
            expect(bounds.height).toBeCloseTo(10);
        });

        test('tracks bezier curve extrema from the current point', ({ hitTestContext }) => {
            const path = new Path(hitTestContext());

            path.vertex(0, 0).bezierVertex(10, 20, 20, 20, 30, 0);

            const bounds = path.getBoundingBox();

            expect(bounds.left).toBe(0);
            expect(bounds.right).toBe(30);
            expect(bounds.top).toBe(0);
            expect(bounds.bottom).toBeCloseTo(15);
            expect(bounds.width).toBe(30);
            expect(bounds.height).toBeCloseTo(15);
        });

        test('bounds arc-to curves by their tangents instead of the full control triangle', ({ hitTestContext }) => {
            const path = new Path(hitTestContext());

            path.curve(0, 10, 10, 10, 10, 0, 5);

            const bounds = path.getBoundingBox();

            expect(bounds.left).toBe(0);
            expect(bounds.right).toBe(10);
            expect(bounds.top).toBeCloseTo(5);
            expect(bounds.bottom).toBe(10);
            expect(bounds.x).toBe(0);
            expect(bounds.y).toBeCloseTo(5);
            expect(bounds.width).toBe(10);
            expect(bounds.height).toBeCloseTo(5);
        });

        test('allows arc-to tangents to extend beyond the control segments', ({ hitTestContext }) => {
            const path = new Path(hitTestContext());

            path.curve(0, 0, 10, 0, 10, 10, 100);

            const bounds = path.getBoundingBox();

            expect(bounds.left).toBeCloseTo(-90);
            expect(bounds.right).toBeCloseTo(10);
            expect(bounds.top).toBeCloseTo(0);
            expect(bounds.bottom).toBeCloseTo(100);
        });
    });
});
