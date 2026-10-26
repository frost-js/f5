import Shape from './../../src/shape.js';
import { expect, test } from './../support/unit.js';

test.describe('Shape Unit', () => {
    test('keeps layers internal', ({ hitTestContext }) => {
        const shape = new Shape(hitTestContext());

        expect('layers' in shape).toBe(false);
    });

    test('returns zero-sized bounds and rendering when empty', ({
        hitTestContext,
        shapeRenderEnvironment,
    }) => {
        const shape = new Shape(hitTestContext());
        const canvas = shape.render();

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
        expect(canvas.getAttribute('width')).toBe('0');
        expect(canvas.getAttribute('height')).toBe('0');
        expect(shapeRenderEnvironment.outerContext.operations).toEqual([]);
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

    test('pads rendered shapes for visible shadows', ({
        hitTestContext,
        shapeRenderEnvironment,
    }) => {
        const shape = new Shape(hitTestContext(), 5, 6)
            .layer((path) => {
                path.rect(10, 20, 30, 40);
            });

        const canvas = shape.render({
            fillStyle: '#f00',
            shadowColor: '#000',
            shadowBlur: 3,
            shadowOffsetX: 4,
            shadowOffsetY: -2,
            strokeStyle: null,
        });

        expect(canvas.getAttribute('width')).toBe('37');
        expect(canvas.getAttribute('height')).toBe('46');
        expect(shapeRenderEnvironment.outerContext.operations[0]).toEqual(['translate', -10, -15]);
        expect(shapeRenderEnvironment.outerContext.operations[1][0]).toBe('translate');
        expect(shapeRenderEnvironment.outerContext.operations[1][1]).toBeCloseTo(0);
        expect(shapeRenderEnvironment.outerContext.operations[1][2]).toBeCloseTo(0);
        expect(shapeRenderEnvironment.outerContext.operations[2]).toEqual(['rotate', 0]);
        expect(shapeRenderEnvironment.outerContext.operations[3][0]).toBe('translate');
        expect(shapeRenderEnvironment.outerContext.operations[3][1]).toBeCloseTo(0);
        expect(shapeRenderEnvironment.outerContext.operations[3][2]).toBeCloseTo(0);
        expect(shapeRenderEnvironment.outerContext.operations[4]).toEqual([
            'drawImage',
            shapeRenderEnvironment.getLayerCanvas(),
            10,
            15,
        ]);
    });
});
