/**
 * @typedef {object} Bounds
 * @property {number} top The minimum Y coordinate.
 * @property {number} right The maximum X coordinate.
 * @property {number} bottom The maximum Y coordinate.
 * @property {number} left The minimum X coordinate.
 * @property {number} x The minimum X coordinate.
 * @property {number} y The minimum Y coordinate.
 * @property {number} width The horizontal extent.
 * @property {number} height The vertical extent.
 */

/**
 * @typedef {object} RenderOptions
 * @property {string|CanvasGradient|CanvasPattern|null} [fillStyle] The fill, or no fill.
 * @property {string|CanvasGradient|CanvasPattern|null} [strokeStyle] The stroke, or no stroke.
 * @property {number} [lineWidth] The stroke width in canvas units.
 * @property {number} [shadowBlur=0] The shadow blur amount.
 * @property {string|null} [shadowColor] The shadow color, or no shadow.
 * @property {number} [shadowOffsetX=0] The horizontal shadow offset.
 * @property {number} [shadowOffsetY=0] The vertical shadow offset.
 */

/**
 * Creates an empty axis-aligned bounding box.
 * @returns {Bounds} A zero-sized box at the origin.
 */
export function emptyBounds() {
    return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };
}

/**
 * Applies shared fill, stroke, and shadow options to a context.
 * @param {CanvasRenderingContext2D} context The drawing context.
 * @param {RenderOptions} [options={}] The rendering styles.
 */
export function applyStyles(context, options = {}) {
    if (options.fillStyle != null) {
        context.fillStyle = options.fillStyle;
    }

    if (options.strokeStyle != null) {
        context.strokeStyle = options.strokeStyle;
    }

    context.lineWidth = options.lineWidth ?? 1;
    context.shadowBlur = options.shadowBlur ?? 0;
    context.shadowColor = options.shadowColor ?? 'transparent';
    context.shadowOffsetX = options.shadowOffsetX ?? 0;
    context.shadowOffsetY = options.shadowOffsetY ?? 0;
}

/**
 * Rounds bounds outward and adds space for strokes and shadows.
 * @param {Bounds} bounds The unpadded geometry bounds.
 * @param {RenderOptions} [options={}] The rendering styles.
 * @returns {{x: number, y: number, width: number, height: number}} The integer canvas origin and dimensions.
 */
export function getRenderBounds(bounds, options = {}) {
    const stroke = options.strokeStyle ?
        Math.max(options.lineWidth ?? 0, 0) :
        0;
    const hasShadow = Boolean(options.shadowColor);
    const shadowBlur = hasShadow ? Math.max(options.shadowBlur ?? 0, 0) : 0;
    const shadowOffsetX = hasShadow ? options.shadowOffsetX ?? 0 : 0;
    const shadowOffsetY = hasShadow ? options.shadowOffsetY ?? 0 : 0;

    let left = bounds.x - stroke;
    let top = bounds.y - stroke;
    let right = bounds.x + bounds.width + stroke;
    let bottom = bounds.y + bounds.height + stroke;

    if (shadowBlur || shadowOffsetX || shadowOffsetY) {
        left = Math.min(left, left + shadowOffsetX - shadowBlur);
        top = Math.min(top, top + shadowOffsetY - shadowBlur);
        right = Math.max(right, right + shadowOffsetX + shadowBlur);
        bottom = Math.max(bottom, bottom + shadowOffsetY + shadowBlur);
    }

    const x = Math.floor(left);
    const y = Math.floor(top);

    return {
        x,
        y,
        width: Math.max(Math.ceil(right) - x, 0),
        height: Math.max(Math.ceil(bottom) - y, 0),
    };
}
