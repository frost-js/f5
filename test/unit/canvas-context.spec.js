import CanvasContext from './../../src/canvas-context.js';
import { expect, test } from './../support/unit.js';

test.describe('CanvasContext Unit', () => {
    test('freezes the shared defaults object', () => {
        expect(Object.isFrozen(CanvasContext.defaults)).toBe(true);
    });

    test('requires a canvas node with a 2d context', ({ canvasNode }) => {
        expect(() => new CanvasContext(canvasNode(null), 20, 10)).toThrow(
            'CanvasContext requires a 2D canvas context.',
        );
    });

    test('clears in canvas space even after transforms', ({
        canvasNode,
        recordingContext,
    }) => {
        const canvas = new CanvasContext(canvasNode(recordingContext), 20, 10);

        canvas.translate(5, 7).clear();

        expect(recordingContext.operations).toContainEqual(['translate', 5, 7]);
        expect(recordingContext.operations).toContainEqual(['save']);
        expect(recordingContext.operations).toContainEqual(['resetTransform']);
        expect(recordingContext.operations).toContainEqual(['clearRect', 0, 0, 20, 10]);
        expect(recordingContext.operations.at(-1)).toEqual(['restore']);
    });

    test('draws the background in canvas space even after transforms', ({
        canvasNode,
        recordingContext,
    }) => {
        const canvas = new CanvasContext(canvasNode(recordingContext), 20, 10);

        canvas.translate(5, 7).background('#f00');

        expect(recordingContext.operations).toContainEqual(['translate', 5, 7]);
        expect(recordingContext.operations).toContainEqual(['save']);
        expect(recordingContext.operations).toContainEqual(['resetTransform']);
        expect(recordingContext.operations).toContainEqual(['rect', 0, 0, 20, 10]);
        expect(recordingContext.operations).toContainEqual(['fill']);
        expect(recordingContext.operations.at(-1)).toEqual(['restore']);
    });

    test('offsets stroked paths by the stroke padding when drawing', ({
        canvasNode,
        recordingContext,
    }) => {
        const canvas = new CanvasContext(canvasNode(recordingContext), 20, 10, {
            lineWidth: 4,
            strokeStyle: '#000',
        });
        const renderedPath = {};
        const path = {
            getBoundingBox() {
                return {
                    height: 40.1,
                    width: 30.4,
                    x: 10.8,
                    y: 20.2,
                };
            },
            render() {
                return renderedPath;
            },
        };

        canvas.drawPath(path, 3, 5);

        expect(recordingContext.operations.at(-1)).toEqual(['drawImage', renderedPath, 9, 21]);
    });

    test('does not offset fill-only shapes for an unused line width', ({
        canvasNode,
        recordingContext,
    }) => {
        const canvas = new CanvasContext(canvasNode(recordingContext), 20, 10, {
            lineWidth: 4,
            strokeStyle: null,
        });
        const renderedShape = {};
        const shape = {
            getBoundingBox() {
                return {
                    height: 40.1,
                    width: 30.4,
                    x: 10.8,
                    y: 20.2,
                };
            },
            render() {
                return renderedShape;
            },
        };

        canvas.drawShape(shape, 3, 5);

        expect(recordingContext.operations.at(-1)).toEqual(['drawImage', renderedShape, 13, 25]);
    });

    test('preserves transforms while erasing', ({ canvasNode, recordingContext }) => {
        const canvas = new CanvasContext(canvasNode(recordingContext), 20, 10);
        const path = {
            getBoundingBox() {
                return {
                    height: 10,
                    width: 10,
                    x: 0,
                    y: 0,
                };
            },
            render() {
                return {};
            },
        };

        canvas.createPath = () => path;

        canvas.translate(5, 7).erase(() => {});

        expect(recordingContext.operations).toContainEqual(['translate', 5, 7]);
        expect(recordingContext.operations).toContainEqual(['save']);
        expect(recordingContext.operations).toContainEqual(['drawImage', {}, 0, 0]);
        expect(recordingContext.operations.at(-1)).toEqual(['restore']);
    });

    test('clears saved state when resizing so a later pop does not restore stale canvas state', ({
        canvasNode,
        recordingContext,
    }) => {
        const canvas = new CanvasContext(canvasNode(recordingContext), 20, 10);

        canvas.fill('#f00').push().fill('#00f');
        recordingContext.operations = [];

        canvas.resize(30, 40).pop();

        expect(canvas.getOptions().fillStyle).toBe('#00f');
        expect(recordingContext.operations).toEqual([]);
    });

    test('rejects non-finite resize values', ({ canvasNode }) => {
        const canvas = new CanvasContext(canvasNode(), 20, 10);

        expect(() => canvas.resize(Number.NaN, 10)).toThrow('Canvas dimensions');
        expect(() => canvas.resize(10, -1)).toThrow('Canvas dimensions');
    });

    test('draws points using half the stroke width as the radius', ({
        canvasNode,
        recordingContext,
    }) => {
        const canvas = new CanvasContext(canvasNode(recordingContext), 20, 10, {
            strokeStyle: '#000',
            lineWidth: 4,
        });

        canvas.point(3, 5);

        expect(recordingContext.operations[0]).toEqual(['save']);
        expect(recordingContext.operations).toContainEqual(['ellipse', 3, 5, 2, 2, 0, 0, Math.PI * 2]);
        expect(recordingContext.operations).toContainEqual(['fill']);
        expect(recordingContext.operations.at(-1)).toEqual(['restore']);
    });

    test('uses default and custom text alignment settings', ({
        canvasNode,
        recordingContext,
    }) => {
        const canvas = new CanvasContext(canvasNode(recordingContext), 20, 10, {
            fillStyle: '#000',
            strokeStyle: null,
        });

        canvas.text('Hello', 2, 3);

        expect(recordingContext.textAlign).toBe('start');
        expect(recordingContext.textBaseline).toBe('alphabetic');
        expect(recordingContext.operations.at(-1)).toEqual(['fillText', 'Hello', 2, 3]);

        canvas.textAlign('center').textBaseline('middle').text('World', 4, 5);

        expect(recordingContext.textAlign).toBe('center');
        expect(recordingContext.textBaseline).toBe('middle');
        expect(recordingContext.operations.at(-1)).toEqual(['fillText', 'World', 4, 5]);
    });
});
