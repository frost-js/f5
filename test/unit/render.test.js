import { expect, test } from '@playwright/test';
import {
    applyStyles,
    getRenderBounds,
} from '../../src/render.js';

test.describe('Render', () => {
    test('pads render bounds for strokes and shadows', () => {
        expect(getRenderBounds({
            x: 10,
            y: 20,
            width: 30,
            height: 40,
        }, {
            lineWidth: 2,
            shadowBlur: 3,
            shadowColor: '#000',
            shadowOffsetX: 4,
            shadowOffsetY: -5,
            strokeStyle: '#000',
        })).toEqual({
            x: 8,
            y: 10,
            width: 41,
            height: 52,
        });
    });

    test('applies the shared render styles to a canvas context', () => {
        const context = {};

        applyStyles(context, {
            fillStyle: '#f00',
            lineWidth: 4,
            shadowBlur: 2,
            shadowColor: '#000',
            shadowOffsetX: 3,
            shadowOffsetY: -1,
            strokeStyle: '#0f0',
        });

        expect(context).toEqual({
            fillStyle: '#f00',
            lineWidth: 4,
            shadowBlur: 2,
            shadowColor: '#000',
            shadowOffsetX: 3,
            shadowOffsetY: -1,
            strokeStyle: '#0f0',
        });
    });
});

