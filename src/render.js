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
