/** @import { Bounds, RenderOptions } from './render.js'; */

import Path from './path.js';
import { emptyBounds, getRenderBounds } from './render.js';
import Vector from './vector.js';

/**
 * Composes ordered paths and contours into a positioned, rotatable shape.
 */
export default class Shape {
    #context;
    #layers;

    /**
     * Creates a Shape.
     * @param {CanvasRenderingContext2D} context The canvas context.
     * @param {number} [x=0] The global X position.
     * @param {number} [y=0] The global Y position.
     * @param {number} [angle=0] The rotation angle.
     * @param {number} [anchorX=0] The anchor X position.
     * @param {number} [anchorY=0] The anchor Y position.
     */
    constructor(context, x = 0, y = 0, angle = 0, anchorX = 0, anchorY = 0) {
        this.#context = context;

        this.x = x;
        this.y = y;
        this.angle = angle;
        this.anchorX = anchorX;
        this.anchorY = anchorY;

        this.#layers = [];
    }

    /**
     * Determines if the shape contains a point.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @returns {boolean} Whether the global point lies inside a filled layer after contours are applied.
     */
    containsPoint(x, y) {
        const anchor = Vector.create(this.x + this.anchorX, this.y + this.anchorY);
        const rotatedPoint = Vector.create(x, y)
            .sub(anchor)
            .rotate(-this.angle)
            .add(anchor);

        let pointInShape = false;

        for (const { contour, path } of this.#layers) {
            if (pointInShape === !contour) {
                continue;
            }

            if (path.containsPoint(rotatedPoint.x - this.x, rotatedPoint.y - this.y)) {
                pointInShape = !contour;
            }
        }

        return pointInShape;
    }

    /**
     * Adds a contour to the shape.
     * @param {(path: Path) => void} callback The callback to generate the path.
     * @returns {Shape} The Shape.
     */
    contour(callback) {
        return this.layer(callback, true);
    }

    /**
     * Gets the bounding box of the shape.
     * @returns {Bounds} The bounding box.
     */
    getBoundingBox() {
        const bounding = {
            top: Number.POSITIVE_INFINITY,
            right: Number.NEGATIVE_INFINITY,
            bottom: Number.NEGATIVE_INFINITY,
            left: Number.POSITIVE_INFINITY,
        };

        for (const layer of this.#layers) {
            if (layer.contour) {
                continue;
            }

            const bounds = layer.path.getBoundingBox();
            const rotated1 = this.#rotatePoint(bounds.right, bounds.top);
            const rotated2 = this.#rotatePoint(bounds.right, bounds.bottom);
            const rotated3 = this.#rotatePoint(bounds.left, bounds.bottom);
            const rotated4 = this.#rotatePoint(bounds.left, bounds.top);

            bounding.top = Math.min(bounding.top, rotated1.y, rotated2.y, rotated3.y, rotated4.y);
            bounding.right = Math.max(bounding.right, rotated1.x, rotated2.x, rotated3.x, rotated4.x);
            bounding.bottom = Math.max(bounding.bottom, rotated1.y, rotated2.y, rotated3.y, rotated4.y);
            bounding.left = Math.min(bounding.left, rotated1.x, rotated2.x, rotated3.x, rotated4.x);
        }

        if (
            !Number.isFinite(bounding.top) ||
            !Number.isFinite(bounding.right) ||
            !Number.isFinite(bounding.bottom) ||
            !Number.isFinite(bounding.left)
        ) {
            return emptyBounds();
        }

        return {
            top: bounding.top + this.y,
            right: bounding.right + this.x,
            bottom: bounding.bottom + this.y,
            left: bounding.left + this.x,
            x: bounding.left + this.x,
            y: bounding.top + this.y,
            width: bounding.right - bounding.left,
            height: bounding.bottom - bounding.top,
        };
    }

    /**
     * Adds a layer to the shape.
     * @param {(path: Path) => void} callback The callback to generate the path.
     * @param {boolean} [contour=false] Whether the path is contoured.
     * @returns {Shape} The Shape.
     */
    layer(callback, contour = false) {
        const path = new Path(this.#context);

        callback(path);

        this.#layers.push({
            contour,
            path,
        });

        return this;
    }

    /**
     * Renders the shape.
     * @param {RenderOptions} [options={}] The rendering options.
     * @returns {HTMLCanvasElement} The rendered canvas.
     */
    render(options = {}) {
        const canvas = document.createElement('canvas');

        if (!this.#layers.length) {
            canvas.setAttribute('width', 0);
            canvas.setAttribute('height', 0);

            return canvas;
        }

        const renderBounds = getRenderBounds(this.getBoundingBox(), options);
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Unable to create a 2D canvas context.');
        }

        canvas.setAttribute('width', renderBounds.width);
        canvas.setAttribute('height', renderBounds.height);

        context.translate(this.x - renderBounds.x, this.y - renderBounds.y);
        context.translate(this.anchorX, this.anchorY);
        context.rotate(this.angle);
        context.translate(-this.anchorX, -this.anchorY);

        for (const { contour, path } of this.#layers) {
            let layerOptions;

            if (contour) {
                context.globalCompositeOperation = 'destination-out';
                layerOptions = {
                    ...options,
                    fillStyle: '#000',
                };
            } else {
                context.globalCompositeOperation = 'source-over';
                layerOptions = options;
            }

            const layerBounds = getRenderBounds(path.getBoundingBox(), layerOptions);
            const layerCanvas = path.render(layerOptions);

            context.drawImage(layerCanvas, layerBounds.x, layerBounds.y);
        }

        return canvas;
    }

    /**
     * Rotates a point around the anchor.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @returns {Vector} The rotated Vector.
     */
    #rotatePoint(x, y) {
        const translatedX = x - this.anchorX;
        const translatedY = y - this.anchorY;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        return Vector.create(
            translatedX * cos - translatedY * sin + this.anchorX,
            translatedX * sin + translatedY * cos + this.anchorY,
        );
    }
}
