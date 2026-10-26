/** @import { Bounds, RenderOptions } from './render.js'; */

import {
    getArcBoundsPoints,
    getArcToBounds,
    getCubicBoundsPoints,
    getQuadraticBoundsPoints,
} from './path-bounds.js';
import { applyStyles, emptyBounds, getRenderBounds } from './render.js';

/**
 * Path
 */
export default class Path {
    #bounding;
    #context;
    #currentX;
    #currentY;
    #hasVertex;
    #path;
    #subpathStartX;
    #subpathStartY;

    /**
     * New Path constructor.
     * @param {CanvasRenderingContext2D} context The canvas context.
     */
    constructor(context) {
        if (!context || typeof context.isPointInPath !== 'function') {
            throw new TypeError('Path requires a 2D canvas context.');
        }

        if (typeof Path2D !== 'function') {
            throw new TypeError('Path requires Path2D support.');
        }

        this.#context = context;

        this.#path = new Path2D();
        this.#hasVertex = false;
        this.#currentX = null;
        this.#currentY = null;
        this.#subpathStartX = null;
        this.#subpathStartY = null;

        this.#bounding = {
            top: Number.POSITIVE_INFINITY,
            right: Number.NEGATIVE_INFINITY,
            bottom: Number.NEGATIVE_INFINITY,
            left: Number.POSITIVE_INFINITY,
        };
    }

    /**
     * Add an arc.
     * @param {number} x The X position of the arc center.
     * @param {number} y The Y position of the arc center.
     * @param {number} radius The arc radius.
     * @param {number} startAngle The arc start angle.
     * @param {number} endAngle The arc end angle.
     * @returns {Path} The Path.
     */
    arc(x, y, radius, startAngle, endAngle) {
        const startsSubpath = !this.#hasVertex;

        this.#path.arc(x, y, radius, startAngle, endAngle);
        this.#setBoundsFromPoints(getArcBoundsPoints(x, y, radius, startAngle, endAngle));

        if (startsSubpath) {
            this.#subpathStartX = x + Math.cos(startAngle) * radius;
            this.#subpathStartY = y + Math.sin(startAngle) * radius;
        }

        this.#setCurrentPoint(
            x + Math.cos(endAngle) * radius,
            y + Math.sin(endAngle) * radius,
        );

        return this;
    }

    /**
     * Add a bezier curve.
     * @param {number} x1 The start X position.
     * @param {number} y1 The start Y position.
     * @param {number} cx1 The first control point X position.
     * @param {number} cy1 The first control point Y position.
     * @param {number} cx2 The second control point X position.
     * @param {number} cy2 The second control point Y position.
     * @param {number} x2 The end X position.
     * @param {number} y2 The end Y position.
     * @returns {Path} The Path.
     */
    bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
        this.#moveTo(x1, y1);
        this.#path.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
        this.#setBoundsFromPoints(getCubicBoundsPoints(x1, y1, cx1, cy1, cx2, cy2, x2, y2));
        this.#setCurrentPoint(x2, y2, false);

        return this;
    }

    /**
     * Add a bezier vertex.
     * @param {number} cx1 The first control point X position.
     * @param {number} cy1 The first control point Y position.
     * @param {number} cx2 The second control point X position.
     * @param {number} cy2 The second control point Y position.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @returns {Path} The Path.
     */
    bezierVertex(cx1, cy1, cx2, cy2, x, y) {
        const startX = this.#currentX ?? cx1;
        const startY = this.#currentY ?? cy1;

        this.#path.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
        this.#setBoundsFromPoints(
            this.#hasVertex ?
                getCubicBoundsPoints(startX, startY, cx1, cy1, cx2, cy2, x, y) :
                [
                    { x: cx1, y: cy1 },
                    { x: cx2, y: cy2 },
                    { x, y },
                ],
        );
        this.#setCurrentPoint(x, y);

        return this;
    }

    /**
     * Add a circle.
     * @param {number} x The X position of the circle center.
     * @param {number} y The Y position of the circle center.
     * @param {number} radius The circle radius.
     * @returns {Path} The Path.
     */
    circle(x, y, radius) {
        return this.ellipse(x, y, radius * 2, radius * 2);
    }

    /**
     * Close the path.
     * @returns {Path} The Path.
     */
    close() {
        this.#path.closePath();

        if (this.#subpathStartX !== null && this.#subpathStartY !== null) {
            this.#currentX = this.#subpathStartX;
            this.#currentY = this.#subpathStartY;
            this.#hasVertex = true;
        }

        return this;
    }

    /**
     * Determine if the path contains a point.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @returns {boolean} TRUE if the path contains the point, otherwise FALSE.
     */
    containsPoint(x, y) {
        return this.#context.isPointInPath(this.#path, x, y);
    }

    /**
     * Add a curve.
     * @param {number} x1 The start X position.
     * @param {number} y1 The start Y position.
     * @param {number} cx1 The first control point X position.
     * @param {number} cy1 The first control point Y position.
     * @param {number} cx2 The second control point X position.
     * @param {number} cy2 The second control point Y position.
     * @param {number} radius The arc radius.
     * @returns {Path} The Path.
     */
    curve(x1, y1, cx1, cy1, cx2, cy2, radius) {
        this.#moveTo(x1, y1);
        this.#path.arcTo(cx1, cy1, cx2, cy2, radius);

        const { currentPoint, points } = getArcToBounds(
            { x: x1, y: y1 },
            { x: cx1, y: cy1 },
            { x: cx2, y: cy2 },
            radius,
        );

        this.#setBoundsFromPoints(points);
        this.#setCurrentPoint(currentPoint.x, currentPoint.y, false);

        return this;
    }

    /**
     * Add a curve vertex.
     * @param {number} cx1 The first control point X position.
     * @param {number} cy1 The first control point Y position.
     * @param {number} cx2 The second control point X position.
     * @param {number} cy2 The second control point Y position.
     * @param {number} radius The arc radius.
     * @returns {Path} The Path.
     */
    curveVertex(cx1, cy1, cx2, cy2, radius) {
        const start = this.#hasVertex ?
            { x: this.#currentX, y: this.#currentY } :
            { x: cx1, y: cy1 };

        this.#path.arcTo(cx1, cy1, cx2, cy2, radius);

        const { currentPoint, points } = getArcToBounds(
            start,
            { x: cx1, y: cy1 },
            { x: cx2, y: cy2 },
            radius,
        );

        this.#setBoundsFromPoints(points);
        this.#setCurrentPoint(currentPoint.x, currentPoint.y);

        return this;
    }

    /**
     * Add an ellipse.
     * @param {number} x The X position of the ellipse center.
     * @param {number} y The Y position of the ellipse center.
     * @param {number} width The ellipse width.
     * @param {number} height The ellipse height.
     * @param {number} [angle=0] The ellipse angle.
     * @returns {Path} The Path.
     */
    ellipse(x, y, width, height, angle = 0) {
        const xRadius = width / 2;
        const yRadius = height / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const xExtent = Math.hypot(xRadius * cos, yRadius * sin);
        const yExtent = Math.hypot(xRadius * sin, yRadius * cos);

        this.#path.ellipse(x, y, xRadius, yRadius, angle, 0, Math.PI * 2);

        this.#setBounds([x - xExtent, x + xExtent], [y - yExtent, y + yExtent]);
        this.#setCurrentPoint(x + xRadius * cos, y + xRadius * sin);

        return this;
    }

    /**
     * Get the bounding box of the path.
     * @returns {Bounds} The bounding box.
     */
    getBoundingBox() {
        if (
            !Number.isFinite(this.#bounding.top) ||
            !Number.isFinite(this.#bounding.right) ||
            !Number.isFinite(this.#bounding.bottom) ||
            !Number.isFinite(this.#bounding.left)
        ) {
            return emptyBounds();
        }

        return {
            top: this.#bounding.top,
            right: this.#bounding.right,
            bottom: this.#bounding.bottom,
            left: this.#bounding.left,
            x: this.#bounding.left,
            y: this.#bounding.top,
            width: this.#bounding.right - this.#bounding.left,
            height: this.#bounding.bottom - this.#bounding.top,
        };
    }

    /**
     * Add a line.
     * @param {number} x1 The start X position.
     * @param {number} y1 The start Y position.
     * @param {number} x2 The end X position.
     * @param {number} y2 The end Y position.
     * @returns {Path} The Path.
     */
    line(x1, y1, x2, y2) {
        this.#moveTo(x1, y1);
        this.#path.lineTo(x2, y2);

        this.#setBounds([x1, x2], [y1, y2]);
        this.#setCurrentPoint(x2, y2, false);

        return this;
    }

    /**
     * Add a quadrilateral.
     * @param {number} x1 The first point X position.
     * @param {number} y1 The first point Y position.
     * @param {number} x2 The second point X position.
     * @param {number} y2 The second point Y position.
     * @param {number} x3 The third point X position.
     * @param {number} y3 The third point Y position.
     * @param {number} x4 The fourth point X position.
     * @param {number} y4 The fourth point Y position.
     * @returns {Path} The Path.
     */
    quad(x1, y1, x2, y2, x3, y3, x4, y4) {
        this.#moveTo(x1, y1);
        this.#path.lineTo(x2, y2);
        this.#path.lineTo(x3, y3);
        this.#path.lineTo(x4, y4);
        this.#path.closePath();

        this.#setBounds([x1, x2, x3, x4], [y1, y2, y3, y4]);
        this.#currentX = x1;
        this.#currentY = y1;

        return this;
    }

    /**
     * Add a quadratic vertex.
     * @param {number} cx The control point X position.
     * @param {number} cy The control point Y position.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @returns {Path} The Path.
     */
    quadraticVertex(cx, cy, x, y) {
        const startX = this.#currentX ?? cx;
        const startY = this.#currentY ?? cy;

        this.#path.quadraticCurveTo(cx, cy, x, y);
        this.#setBoundsFromPoints(
            this.#hasVertex ?
                getQuadraticBoundsPoints(startX, startY, cx, cy, x, y) :
                [
                    { x: cx, y: cy },
                    { x, y },
                ],
        );
        this.#setCurrentPoint(x, y);

        return this;
    }

    /**
     * Add a rectangle.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @param {number} width The rectangle width.
     * @param {number} height The rectangle height.
     * @returns {Path} The Path.
     */
    rect(x, y, width, height) {
        this.#path.rect(x, y, width, height);

        this.#setBounds([x, x + width], [y, y + height]);
        this.#setCurrentPoint(x, y, true);

        return this;
    }

    /**
     * Render the path.
     * @param {RenderOptions} [options={}] The rendering options.
     * @returns {HTMLCanvasElement} The rendered canvas.
     */
    render(options = {}) {
        const bounds = this.getBoundingBox();
        const renderBounds = getRenderBounds(bounds, options);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Unable to create a 2D canvas context.');
        }

        canvas.setAttribute('width', renderBounds.width);
        canvas.setAttribute('height', renderBounds.height);

        applyStyles(context, options);
        context.translate(-renderBounds.x, -renderBounds.y);

        if (options.fillStyle) {
            context.fill(this.#path);
        }

        if (options.strokeStyle) {
            context.stroke(this.#path);
        }

        return canvas;
    }

    /**
     * Add a square.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @param {number} size The square size.
     * @returns {Path} The Path.
     */
    square(x, y, size) {
        return this.rect(x, y, size, size);
    }

    /**
     * Add a triangle.
     * @param {number} x1 The first X position.
     * @param {number} y1 The first Y position.
     * @param {number} x2 The second X position.
     * @param {number} y2 The second Y position.
     * @param {number} x3 The third X position.
     * @param {number} y3 The third Y position.
     * @returns {Path} The Path.
     */
    triangle(x1, y1, x2, y2, x3, y3) {
        this.#moveTo(x1, y1);
        this.#path.lineTo(x2, y2);
        this.#path.lineTo(x3, y3);
        this.#path.closePath();

        this.#setBounds([x1, x2, x3], [y1, y2, y3]);
        this.#currentX = x1;
        this.#currentY = y1;

        return this;
    }

    /**
     * Add a vertex.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @returns {Path} The Path.
     */
    vertex(x, y) {
        if (!this.#hasVertex) {
            this.#moveTo(x, y);
        } else {
            this.#path.lineTo(x, y);
            this.#setCurrentPoint(x, y, false);
        }

        this.#setBounds([x], [y]);

        return this;
    }

    /**
     * Move to a new subpath start.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     */
    #moveTo(x, y) {
        this.#path.moveTo(x, y);
        this.#setCurrentPoint(x, y, true);
    }

    /**
     * Set the path bounds.
     * @param {number[]} xs The X co-ordinates.
     * @param {number[]} ys The Y co-ordinates.
     */
    #setBounds(xs, ys) {
        this.#bounding.top = Math.min(this.#bounding.top, ...ys);
        this.#bounding.right = Math.max(this.#bounding.right, ...xs);
        this.#bounding.bottom = Math.max(this.#bounding.bottom, ...ys);
        this.#bounding.left = Math.min(this.#bounding.left, ...xs);
    }

    /**
     * Set the path bounds from points.
     * @param {{x: number, y: number}[]} points The points to include.
     */
    #setBoundsFromPoints(points) {
        this.#setBounds(
            points.map((point) => point.x),
            points.map((point) => point.y),
        );
    }

    /**
     * Set the current point.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @param {boolean} [resetSubpath=false] Whether to reset the subpath start.
     */
    #setCurrentPoint(x, y, resetSubpath = false) {
        this.#currentX = x;
        this.#currentY = y;
        this.#hasVertex = true;

        if (resetSubpath || this.#subpathStartX === null || this.#subpathStartY === null) {
            this.#subpathStartX = x;
            this.#subpathStartY = y;
        }
    }
}
