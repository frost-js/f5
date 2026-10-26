/** @import { RenderOptions } from './render.js'; */

import Path from './path.js';
import { applyStyles, getRenderBounds } from './render.js';
import Shape from './shape.js';

/**
 * @typedef {object} TextOptions
 * @property {string} [font='sans-serif'] The font family.
 * @property {number} [fontSize=10] The font size in pixels.
 * @property {string|number|null} [fontWeight=null] The font weight.
 * @property {CanvasTextAlign} [textAlign='start'] The horizontal text alignment.
 * @property {CanvasTextBaseline} [textBaseline='alphabetic'] The vertical text alignment.
 */

/** @typedef {RenderOptions & TextOptions} CanvasContextOptions */

/**
 * Provides chainable drawing, styling, and transforms for a 2D canvas.
 */
export default class CanvasContext {
    /** @type {Readonly<CanvasContextOptions>} */
    static defaults = Object.freeze({
        fillStyle: null,
        font: 'sans-serif',
        fontSize: 10,
        fontWeight: null,
        lineWidth: 1,
        shadowBlur: 0,
        shadowColor: null,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        strokeStyle: '#000',
        textAlign: 'start',
        textBaseline: 'alphabetic',
    });

    #context;
    #hasVertex = false;
    #node;
    #options;
    #states = [];

    /**
     * Creates a CanvasContext.
     * @param {HTMLCanvasElement} node The canvas node.
     * @param {number} [width=600] The canvas width.
     * @param {number} [height=400] The canvas height.
     * @param {CanvasContextOptions} [options={}] The canvas options.
     * @throws {TypeError} When the node does not provide a 2D canvas context.
     * @throws {RangeError} When a canvas dimension is negative or non-finite.
     */
    constructor(node, width = 600, height = 400, options = {}) {
        this.#node = node;
        this.#context = node?.getContext?.('2d');

        if (!this.#context) {
            throw new TypeError('CanvasContext requires a 2D canvas context.');
        }

        this.#options = {
            ...this.constructor.defaults,
            ...options,
        };

        this.resize(width, height);
    }

    /**
     * Applies a matrix transform.
     * @param {number} a The horizontal scaling amount.
     * @param {number} b The vertical skewing.
     * @param {number} c The horizontal skewing.
     * @param {number} d The vertical scaling amount.
     * @param {number} e The horizontal translation.
     * @param {number} f The vertical translation.
     * @returns {CanvasContext} The CanvasContext.
     */
    applyMatrix(a, b, c, d, e, f) {
        this.#context.transform(a, b, c, d, e, f);

        return this;
    }

    /**
     * Draws an arc.
     * @param {number} x The X position of the arc center.
     * @param {number} y The Y position of the arc center.
     * @param {number} radius The arc radius.
     * @param {number} startAngle The arc start angle.
     * @param {number} endAngle The arc end angle.
     * @returns {CanvasContext} The CanvasContext.
     */
    arc(x, y, radius, startAngle, endAngle) {
        this.begin();

        this.#context.arc(x, y, radius, startAngle, endAngle);

        return this.end();
    }

    /**
     * Fills the entire canvas with a color.
     * @param {string|CanvasGradient|CanvasPattern} color The color, gradient, or pattern.
     * @returns {CanvasContext} The CanvasContext.
     */
    background(color) {
        return this.push()
            .resetMatrix()
            .noStroke()
            .fill(color)
            .rect(0, 0, this.width, this.height)
            .pop();
    }

    /**
     * Begins a path.
     * @returns {CanvasContext} The CanvasContext.
     */
    begin() {
        this.#context.beginPath();
        this.#hasVertex = false;

        return this;
    }

    /**
     * Draws a bezier curve.
     * @param {number} x1 The start X position.
     * @param {number} y1 The start Y position.
     * @param {number} cx1 The first control point X position.
     * @param {number} cy1 The first control point Y position.
     * @param {number} cx2 The second control point X position.
     * @param {number} cy2 The second control point Y position.
     * @param {number} x2 The end X position.
     * @param {number} y2 The end Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
        return this.begin()
            .vertex(x1, y1)
            .bezierVertex(cx1, cy1, cx2, cy2, x2, y2)
            .end();
    }

    /**
     * Adds a bezier vertex.
     * @param {number} cx1 The first control point X position.
     * @param {number} cy1 The first control point Y position.
     * @param {number} cx2 The second control point X position.
     * @param {number} cy2 The second control point Y position.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    bezierVertex(cx1, cy1, cx2, cy2, x, y) {
        this.#context.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);

        return this;
    }

    /**
     * Draws a circle.
     * @param {number} x The X position of the circle center.
     * @param {number} y The Y position of the circle center.
     * @param {number} radius The circle radius.
     * @returns {CanvasContext} The CanvasContext.
     */
    circle(x, y, radius) {
        return this.ellipse(x, y, radius * 2, radius * 2);
    }

    /**
     * Clears the entire canvas.
     * @returns {CanvasContext} The CanvasContext.
     */
    clear() {
        this.push();
        this.resetMatrix();

        this.#context.clearRect(0, 0, this.width, this.height);

        return this.pop();
    }

    /**
     * Creates a new Path.
     * @returns {Path} The Path.
     */
    createPath() {
        return new Path(this.#context);
    }

    /**
     * Creates a new Shape.
     * @param {number} [x=0] The global X position.
     * @param {number} [y=0] The global Y position.
     * @param {number} [angle=0] The rotation angle.
     * @param {number} [anchorX=0] The anchor X position.
     * @param {number} [anchorY=0] The anchor Y position.
     * @returns {Shape} The Shape.
     */
    createShape(x = 0, y = 0, angle = 0, anchorX = 0, anchorY = 0) {
        return new Shape(this.#context, x, y, angle, anchorX, anchorY);
    }

    /**
     * Draws a curve.
     * @param {number} x1 The start X position.
     * @param {number} y1 The start Y position.
     * @param {number} cx1 The first control point X position.
     * @param {number} cy1 The first control point Y position.
     * @param {number} cx2 The second control point X position.
     * @param {number} cy2 The second control point Y position.
     * @param {number} radius The arc radius.
     * @returns {CanvasContext} The CanvasContext.
     */
    curve(x1, y1, cx1, cy1, cx2, cy2, radius) {
        return this.begin()
            .vertex(x1, y1)
            .curveVertex(cx1, cy1, cx2, cy2, radius)
            .end();
    }

    /**
     * Adds a curve vertex.
     * @param {number} cx1 The first control point X position.
     * @param {number} cy1 The first control point Y position.
     * @param {number} cx2 The second control point X position.
     * @param {number} cy2 The second control point Y position.
     * @param {number} radius The arc radius.
     * @returns {CanvasContext} The CanvasContext.
     */
    curveVertex(cx1, cy1, cx2, cy2, radius) {
        this.#context.arcTo(cx1, cy1, cx2, cy2, radius);

        return this;
    }

    /**
     * Draws an image on the canvas.
     * @param {HTMLImageElement|SVGImageElement|HTMLVideoElement|HTMLCanvasElement|ImageBitmap|OffscreenCanvas|VideoFrame} image The image.
     * @param {number} [x=0] The X position.
     * @param {number} [y=0] The Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    drawImage(image, x = 0, y = 0) {
        this.#context.drawImage(image, x, y);

        return this;
    }

    /**
     * Draws a Path on the canvas.
     * @param {Path} path The Path.
     * @param {number} [x=0] The X position.
     * @param {number} [y=0] The Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    drawPath(path, x = 0, y = 0) {
        return this.#drawGeometry(path, x, y);
    }

    /**
     * Draws a Shape on the canvas.
     * @param {Shape} shape The Shape.
     * @param {number} [x=0] The X position.
     * @param {number} [y=0] The Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    drawShape(shape, x = 0, y = 0) {
        return this.#drawGeometry(shape, x, y);
    }

    /**
     * Draws an ellipse.
     * @param {number} x The X position of the ellipse center.
     * @param {number} y The Y position of the ellipse center.
     * @param {number} width The ellipse width.
     * @param {number} height The ellipse height.
     * @param {number} [angle=0] The ellipse angle.
     * @returns {CanvasContext} The CanvasContext.
     */
    ellipse(x, y, width, height, angle = 0) {
        this.begin();

        this.#context.ellipse(x, y, width / 2, height / 2, angle, 0, Math.PI * 2);

        return this.end();
    }

    /**
     * End and draw the path.
     * @param {boolean} [close=false] Whether to close the path.
     * @returns {CanvasContext} The CanvasContext.
     */
    end(close = false) {
        if (close) {
            this.#context.closePath();
        }

        this.#draw();

        return this;
    }

    /**
     * Erases a path from the Canvas.
     * @param {(path: Path) => void} callback The callback to generate the path.
     * @returns {CanvasContext} The CanvasContext.
     */
    erase(callback) {
        const path = this.createPath();

        callback(path);

        this.push();

        this.#context.globalCompositeOperation = 'destination-out';
        this.noStroke();
        this.noShadow();
        this.fill('#000');

        this.#applyStyles();
        this.drawPath(path);

        return this.pop();
    }

    /**
     * Sets the fill color/style.
     * @param {string|CanvasGradient|CanvasPattern} color The color, gradient, or pattern.
     * @returns {CanvasContext} The CanvasContext.
     */
    fill(color) {
        this.#options.fillStyle = color;

        return this;
    }

    /**
     * Sets the font family.
     * @param {string} font The font family.
     * @returns {CanvasContext} The CanvasContext.
     */
    font(font) {
        this.#options.font = font;

        return this;
    }

    /**
     * Sets the font size.
     * @param {number} size The font size.
     * @returns {CanvasContext} The CanvasContext.
     */
    fontSize(size) {
        this.#options.fontSize = size;

        return this;
    }

    /**
     * Sets the font weight.
     * @param {string|number} weight The font weight.
     * @returns {CanvasContext} The CanvasContext.
     */
    fontWeight(weight) {
        this.#options.fontWeight = weight;

        return this;
    }

    /**
     * Gets the canvas image data.
     * @param {number} sx The X offset.
     * @param {number} sy The Y offset.
     * @param {number} sw The width.
     * @param {number} sh The height.
     * @returns {ImageData} The image data.
     */
    getImage(sx, sy, sw, sh) {
        return this.#context.getImageData(sx, sy, sw, sh);
    }

    /**
     * Gets the active canvas options.
     * @returns {CanvasContextOptions} A copy of the active options.
     */
    getOptions() {
        return {
            ...this.#options,
        };
    }

    /**
     * Draws a line.
     * @param {number} x1 The start X position.
     * @param {number} y1 The start Y position.
     * @param {number} x2 The end X position.
     * @param {number} y2 The end Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    line(x1, y1, x2, y2) {
        return this.begin()
            .vertex(x1, y1)
            .vertex(x2, y2)
            .end();
    }

    /**
     * Creates a linear gradient.
     * @param {number} x1 The starting X position.
     * @param {number} y1 The starting Y position.
     * @param {number} x2 The ending X position.
     * @param {number} y2 The ending Y position.
     * @returns {CanvasGradient} The CanvasGradient.
     */
    linearGradient(x1, y1, x2, y2) {
        return this.#context.createLinearGradient(x1, y1, x2, y2);
    }

    /**
     * Removes the fill color/style.
     * @returns {CanvasContext} The CanvasContext.
     */
    noFill() {
        this.#options.fillStyle = null;

        return this;
    }

    /**
     * Removes the shadow.
     * @returns {CanvasContext} The CanvasContext.
     */
    noShadow() {
        this.#options.shadowColor = 'rgba(0,0,0,0)';

        return this;
    }

    /**
     * Removes the stroke.
     * @returns {CanvasContext} The CanvasContext.
     */
    noStroke() {
        this.#options.strokeStyle = null;

        return this;
    }

    /**
     * Draws a point.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    point(x, y) {
        const { lineWidth, strokeStyle } = this.#options;
        const radius = Math.max(lineWidth, 1) / 2;

        return this.push()
            .noStroke()
            .fill(strokeStyle)
            .circle(x, y, radius)
            .pop();
    }

    /**
     * Restores the previous canvas settings and transformation.
     * @returns {CanvasContext} The CanvasContext.
     */
    pop() {
        if (this.#states.length) {
            this.#options = this.#states.pop();
            this.#context.restore();
        }

        return this;
    }

    /**
     * Saves the canvas settings and transformation.
     * @returns {CanvasContext} The CanvasContext.
     */
    push() {
        this.#states.push({ ...this.#options });
        this.#context.save();

        return this;
    }

    /**
     * Puts image data on the canvas.
     * @param {ImageData} image The image data.
     * @param {number} dx The X position.
     * @param {number} dy The Y position.
     * @param {number} [dirtyX] The dirty region X offset.
     * @param {number} [dirtyY] The dirty region Y offset.
     * @param {number} [dirtyWidth] The dirty region width.
     * @param {number} [dirtyHeight] The dirty region height.
     * @returns {CanvasContext} The CanvasContext.
     */
    putImage(image, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
        if (arguments.length > 3) {
            this.#context.putImageData(image, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
        } else {
            this.#context.putImageData(image, dx, dy);
        }

        return this;
    }

    /**
     * Draws a quadrilateral.
     * @param {number} x1 The first point X position.
     * @param {number} y1 The first point Y position.
     * @param {number} x2 The second point X position.
     * @param {number} y2 The second point Y position.
     * @param {number} x3 The third point X position.
     * @param {number} y3 The third point Y position.
     * @param {number} x4 The fourth point X position.
     * @param {number} y4 The fourth point Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    quad(x1, y1, x2, y2, x3, y3, x4, y4) {
        return this.begin()
            .vertex(x1, y1)
            .vertex(x2, y2)
            .vertex(x3, y3)
            .vertex(x4, y4)
            .end(true);
    }

    /**
     * Adds a quadratic vertex.
     * @param {number} cx The control point X position.
     * @param {number} cy The control point Y position.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    quadraticVertex(cx, cy, x, y) {
        this.#context.quadraticCurveTo(cx, cy, x, y);

        return this;
    }

    /**
     * Creates a radial gradient.
     * @param {number} x1 The starting X position.
     * @param {number} y1 The starting Y position.
     * @param {number} r1 The starting radius.
     * @param {number} x2 The ending X position.
     * @param {number} y2 The ending Y position.
     * @param {number} r2 The ending radius.
     * @returns {CanvasGradient} The CanvasGradient.
     */
    radialGradient(x1, y1, r1, x2, y2, r2) {
        return this.#context.createRadialGradient(x1, y1, r1, x2, y2, r2);
    }

    /**
     * Draws a rectangle.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @param {number} width The rectangle width.
     * @param {number} height The rectangle height.
     * @returns {CanvasContext} The CanvasContext.
     */
    rect(x, y, width, height) {
        this.begin();

        this.#context.rect(x, y, width, height);

        return this.end();
    }

    /**
     * Resets the canvas settings and transformation.
     * @returns {CanvasContext} The CanvasContext.
     */
    reset() {
        this.#options = {
            ...this.constructor.defaults,
        };

        return this.resetMatrix();
    }

    /**
     * Resets the canvas transformation matrix.
     * @returns {CanvasContext} The CanvasContext.
     */
    resetMatrix() {
        this.#context.resetTransform();

        return this;
    }

    /**
     * Resizes the canvas.
     * @param {number} w The width.
     * @param {number} h The height.
     * @returns {CanvasContext} The CanvasContext.
     */
    resize(w, h) {
        if (![w, h].every((value) => Number.isFinite(value) && value >= 0)) {
            throw new RangeError('Canvas dimensions must be finite, non-negative numbers.');
        }

        this.width = w;
        this.height = h;

        this.#node.width = this.width;
        this.#node.height = this.height;

        this.#states = [];
        this.#hasVertex = false;

        this.#applyStyles();
        this.#context.textAlign = this.#options.textAlign;
        this.#context.textBaseline = this.#options.textBaseline;

        return this;
    }

    /**
     * Rotates the canvas.
     * @param {number} angle The rotation angle.
     * @returns {CanvasContext} The CanvasContext.
     */
    rotate(angle) {
        this.#context.rotate(angle);

        return this;
    }

    /**
     * Scale the canvas.
     * @param {number} x The horizontal scaling.
     * @param {number} [y=x] The vertical scaling.
     * @returns {CanvasContext} The CanvasContext.
     */
    scale(x, y = x) {
        this.#context.scale(x, y);

        return this;
    }

    /**
     * Sets the shadow color.
     * @param {string|CanvasGradient} color The color.
     * @returns {CanvasContext} The CanvasContext.
     */
    shadow(color) {
        this.#options.shadowColor = color;

        return this;
    }

    /**
     * Sets the shadow blur amount.
     * @param {number} amount The blur amount.
     * @returns {CanvasContext} The CanvasContext.
     */
    shadowBlur(amount) {
        this.#options.shadowBlur = amount;

        return this;
    }

    /**
     * Sets the shadow x/y offset.
     * @param {number} [x=0] The X offset.
     * @param {number} [y=0] The Y offset.
     * @returns {CanvasContext} The CanvasContext.
     */
    shadowOffset(x = 0, y = 0) {
        this.#options.shadowOffsetX = x;
        this.#options.shadowOffsetY = y;

        return this;
    }

    /**
     * Draws a square.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @param {number} size The square size.
     * @returns {CanvasContext} The CanvasContext.
     */
    square(x, y, size) {
        return this.rect(x, y, size, size);
    }

    /**
     * Sets the stroke color/style.
     * @param {string|CanvasGradient|CanvasPattern} color The color, gradient, or pattern.
     * @returns {CanvasContext} The CanvasContext.
     */
    stroke(color) {
        this.#options.strokeStyle = color;

        return this;
    }

    /**
     * Sets the stroke width.
     * @param {number} width The width.
     * @returns {CanvasContext} The CanvasContext.
     */
    strokeWidth(width) {
        this.#options.lineWidth = width;

        return this;
    }

    /**
     * Draws text to the canvas.
     * @param {string} text The text to draw.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    text(text, x, y) {
        this.#applyStyles();

        const { font, fontSize, fontWeight } = this.#options;
        const weight = fontWeight ? `${fontWeight} ` : '';

        this.#context.font = `${weight}${fontSize}px ${font}`;
        this.#context.textAlign = this.#options.textAlign;
        this.#context.textBaseline = this.#options.textBaseline;

        if (this.#options.fillStyle) {
            this.#context.fillText(text, x, y);
        }

        if (this.#options.strokeStyle) {
            this.#context.strokeText(text, x, y);
        }

        return this;
    }

    /**
     * Sets the text alignment.
     * @param {CanvasTextAlign} alignment The horizontal text alignment.
     * @returns {CanvasContext} The CanvasContext.
     */
    textAlign(alignment) {
        this.#options.textAlign = alignment;

        return this;
    }

    /**
     * Sets the text baseline.
     * @param {CanvasTextBaseline} baseline The vertical text alignment.
     * @returns {CanvasContext} The CanvasContext.
     */
    textBaseline(baseline) {
        this.#options.textBaseline = baseline;

        return this;
    }

    /**
     * Translates the canvas origin.
     * @param {number} x The X offset.
     * @param {number} y The Y offset.
     * @returns {CanvasContext} The CanvasContext.
     */
    translate(x, y) {
        this.#context.translate(x, y);

        return this;
    }

    /**
     * Draws a triangle.
     * @param {number} x1 The first X position.
     * @param {number} y1 The first Y position.
     * @param {number} x2 The second X position.
     * @param {number} y2 The second Y position.
     * @param {number} x3 The third X position.
     * @param {number} y3 The third Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    triangle(x1, y1, x2, y2, x3, y3) {
        return this.begin()
            .vertex(x1, y1)
            .vertex(x2, y2)
            .vertex(x3, y3)
            .end(true);
    }

    /**
     * Adds a vertex.
     * @param {number} x The X position.
     * @param {number} y The Y position.
     * @returns {CanvasContext} The CanvasContext.
     */
    vertex(x, y) {
        if (!this.#hasVertex) {
            this.#context.moveTo(x, y);
            this.#hasVertex = true;
        } else {
            this.#context.lineTo(x, y);
        }

        return this;
    }

    /**
     * Updates the canvas context.
     */
    #applyStyles() {
        applyStyles(this.#context, this.#options);
    }

    /**
     * Draws to the canvas.
     */
    #draw() {
        this.#applyStyles();

        if (this.#options.fillStyle) {
            this.#context.fill();
        }

        if (this.#options.strokeStyle) {
            this.#context.stroke();
        }
    }

    /**
     * Renders and draws reusable geometry with the active styles.
     * @param {Path|Shape} geometry The geometry to draw.
     * @param {number} x The X offset.
     * @param {number} y The Y offset.
     * @returns {CanvasContext} The CanvasContext.
     */
    #drawGeometry(geometry, x, y) {
        const bounds = getRenderBounds(geometry.getBoundingBox(), this.#options);
        const canvas = geometry.render(this.#options);

        return this.drawImage(canvas, bounds.x + x, bounds.y + y);
    }
}
