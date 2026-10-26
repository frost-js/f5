import { expect, test } from '#unit';
import Shape from '../../src/shape.js';

test.describe('Shape', () => {
    test.describe('layers', () => {
        test('keeps layers internal', ({ hitTestContext }) => {
            const shape = new Shape(hitTestContext());

            expect('layers' in shape).toBe(false);
        });
    });

    test.describe('empty geometry', () => {
        test('returns zero-sized bounds when empty', ({ hitTestContext }) => {
            const shape = new Shape(hitTestContext());

            expect(shape.getBoundingBox()).toEqual({
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

        test('returns a zero-sized bounding box for contour-only shapes', ({
            hitTestContext,
        }) => {
            const shape = new Shape(hitTestContext())
                .contour((path) => {
                    path.rect(0, 0, 10, 10);
                });

            expect(shape.getBoundingBox()).toEqual({
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
    });
});
