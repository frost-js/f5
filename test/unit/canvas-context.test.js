import { expect, test } from '#unit';
import CanvasContext from '../../src/canvas-context.js';

test.describe('CanvasContext', () => {
    test.describe('constructor', () => {
        test('requires a canvas node with a 2d context', ({ canvasNode }) => {
            expect(() => new CanvasContext(canvasNode(null), 20, 10)).toThrow(
                'CanvasContext requires a 2D canvas context.',
            );
        });
    });

    test.describe('#resize', () => {
        test('rejects non-finite or negative dimensions', ({ canvasNode }) => {
            const canvas = new CanvasContext(canvasNode(), 20, 10);

            expect(() => canvas.resize(Number.NaN, 10)).toThrow('Canvas dimensions');
            expect(() => canvas.resize(10, -1)).toThrow('Canvas dimensions');
        });
    });
});
