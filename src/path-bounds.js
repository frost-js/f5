/**
 * @typedef {object} Point
 * @property {number} x The X coordinate.
 * @property {number} y The Y coordinate.
 */

/**
 * @typedef {object} ArcSegment
 * @property {Point} center The circle center.
 * @property {boolean} counterClockwise Whether the arc runs counterclockwise.
 * @property {number} endAngle The end angle in radians.
 * @property {Point} endTangent The outgoing tangent point.
 * @property {number} startAngle The start angle in radians.
 * @property {Point} startTangent The incoming tangent point.
 */

const EPSILON = 1e-10;
const TAU = Math.PI * 2;
const CARDINAL_ANGLES = [
    0,
    Math.PI / 2,
    Math.PI,
    Math.PI * 1.5,
];

/**
 * Calculates the dot product of two coordinate vectors.
 * @param {Point} a The first vector.
 * @param {Point} b The second vector.
 * @returns {number} The dot product.
 */
function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

/**
 * Returns endpoints and cardinal extrema along a circular arc.
 * @param {number} x Center X coordinate.
 * @param {number} y Center Y coordinate.
 * @param {number} radius Circle radius.
 * @param {number} startAngle Start angle in radians.
 * @param {number} endAngle End angle in radians.
 * @param {boolean} [counterClockwise=false] Whether the arc runs counterclockwise.
 * @returns {Point[]} Points enclosing the drawn curve.
 */
export function getArcBoundsPoints(
    x,
    y,
    radius,
    startAngle,
    endAngle,
    counterClockwise = false,
) {
    const points = [
        pointOnCircle(x, y, radius, startAngle),
        pointOnCircle(x, y, radius, endAngle),
    ];

    if (Math.abs(endAngle - startAngle) >= TAU - EPSILON) {
        for (const angle of CARDINAL_ANGLES) {
            points.push(pointOnCircle(x, y, radius, angle));
        }

        return points;
    }

    for (const angle of CARDINAL_ANGLES) {
        if (isAngleWithinArc(startAngle, endAngle, angle, counterClockwise)) {
            points.push(pointOnCircle(x, y, radius, angle));
        }
    }

    return points;
}

/**
 * Calculates the normalized sweep between two angles.
 * @param {number} startAngle The start angle in radians.
 * @param {number} endAngle The end angle in radians.
 * @param {boolean} counterClockwise Whether the arc runs counterclockwise.
 * @returns {number} The sweep in radians, in the range [0, 2π).
 */
function getArcSweep(startAngle, endAngle, counterClockwise) {
    const start = normalizeAngle(startAngle);
    const end = normalizeAngle(endAngle);
    let sweep = counterClockwise ? start - end : end - start;

    if (sweep < 0) {
        sweep += TAU;
    }

    return sweep;
}

/**
 * Calculates tangent-arc bounds and the resulting current point.
 * @param {Point} start Current path position.
 * @param {Point} corner Intersection of the tangent lines.
 * @param {Point} end Point on the outgoing tangent.
 * @param {number} radius Arc radius.
 * @returns {{currentPoint: Point, points: Point[]}} The endpoint and points enclosing the arc.
 */
export function getArcToBounds(start, corner, end, radius) {
    const segment = getArcToSegment(start, corner, end, radius);

    if (!segment) {
        return {
            currentPoint: corner,
            points: [start, corner],
        };
    }

    return {
        currentPoint: segment.endTangent,
        points: [
            start,
            segment.startTangent,
            segment.endTangent,
            ...getArcBoundsPoints(
                segment.center.x,
                segment.center.y,
                radius,
                segment.startAngle,
                segment.endAngle,
                segment.counterClockwise,
            ),
        ],
    };
}

/**
 * Resolves the tangent points, center, and direction of a tangent arc.
 * @param {Point} start The current path position.
 * @param {Point} corner The intersection of the tangent lines.
 * @param {Point} end A point on the outgoing tangent.
 * @param {number} radius The arc radius.
 * @returns {ArcSegment|null} The arc geometry, or null for a degenerate segment.
 */
function getArcToSegment(start, corner, end, radius) {
    if (radius <= 0) {
        return null;
    }

    const toStart = normalizeVector(start.x - corner.x, start.y - corner.y);
    const toEnd = normalizeVector(end.x - corner.x, end.y - corner.y);

    if (!toStart || !toEnd) {
        return null;
    }

    const angle = Math.acos(Math.min(Math.max(dot(toStart, toEnd), -1), 1));

    if (angle <= EPSILON || Math.abs(Math.PI - angle) <= EPSILON) {
        return null;
    }

    const tangentDistance = radius / Math.tan(angle / 2);

    if (!Number.isFinite(tangentDistance)) {
        return null;
    }

    const startTangent = {
        x: corner.x + toStart.x * tangentDistance,
        y: corner.y + toStart.y * tangentDistance,
    };
    const endTangent = {
        x: corner.x + toEnd.x * tangentDistance,
        y: corner.y + toEnd.y * tangentDistance,
    };
    const bisector = normalizeVector(toStart.x + toEnd.x, toStart.y + toEnd.y);

    if (!bisector) {
        return null;
    }

    const centerDistance = radius / Math.sin(angle / 2);
    const center = {
        x: corner.x + bisector.x * centerDistance,
        y: corner.y + bisector.y * centerDistance,
    };
    const startRadius = {
        x: startTangent.x - center.x,
        y: startTangent.y - center.y,
    };
    const inputDirection = {
        x: -toStart.x,
        y: -toStart.y,
    };
    const counterClockwiseTangent = {
        x: -startRadius.y,
        y: startRadius.x,
    };
    const clockwiseTangent = {
        x: startRadius.y,
        y: -startRadius.x,
    };

    return {
        center,
        counterClockwise: dot(clockwiseTangent, inputDirection) >
            dot(counterClockwiseTangent, inputDirection),
        endAngle: Math.atan2(endTangent.y - center.y, endTangent.x - center.x),
        endTangent,
        startAngle: Math.atan2(startTangent.y - center.y, startTangent.x - center.x),
        startTangent,
    };
}

/**
 * Returns endpoints and extrema of a cubic Bezier curve.
 * @param {number} startX Start X coordinate.
 * @param {number} startY Start Y coordinate.
 * @param {number} control1X First control X coordinate.
 * @param {number} control1Y First control Y coordinate.
 * @param {number} control2X Second control X coordinate.
 * @param {number} control2Y Second control Y coordinate.
 * @param {number} endX End X coordinate.
 * @param {number} endY End Y coordinate.
 * @returns {Point[]} Points enclosing the drawn curve.
 */
export function getCubicBoundsPoints(
    startX,
    startY,
    control1X,
    control1Y,
    control2X,
    control2Y,
    endX,
    endY,
) {
    const ts = new Set([
        0,
        1,
        ...getCubicExtrema(startX, control1X, control2X, endX),
        ...getCubicExtrema(startY, control1Y, control2Y, endY),
    ]);

    return [...ts].map((t) => ({
        x: getCubicValue(startX, control1X, control2X, endX, t),
        y: getCubicValue(startY, control1Y, control2Y, endY, t),
    }));
}

/**
 * Finds interior parameters where a cubic Bézier coordinate reaches an extremum.
 * @param {number} p0 The start coordinate.
 * @param {number} p1 The first control coordinate.
 * @param {number} p2 The second control coordinate.
 * @param {number} p3 The end coordinate.
 * @returns {number[]} The parameters strictly between zero and one.
 */
function getCubicExtrema(p0, p1, p2, p3) {
    const a = -p0 + 3 * p1 - 3 * p2 + p3;
    const b = 3 * p0 - 6 * p1 + 3 * p2;
    const c = -3 * p0 + 3 * p1;

    if (Math.abs(a) <= EPSILON) {
        if (Math.abs(b) <= EPSILON) {
            return [];
        }

        const t = -c / (2 * b);

        return t > EPSILON && t < 1 - EPSILON ? [t] : [];
    }

    const derivativeA = 3 * a;
    const derivativeB = 2 * b;
    const discriminant = derivativeB * derivativeB - 4 * derivativeA * c;

    if (discriminant < -EPSILON) {
        return [];
    }

    if (Math.abs(discriminant) <= EPSILON) {
        const t = -derivativeB / (2 * derivativeA);

        return t > EPSILON && t < 1 - EPSILON ? [t] : [];
    }

    const sqrt = Math.sqrt(discriminant);

    return [
        (-derivativeB + sqrt) / (2 * derivativeA),
        (-derivativeB - sqrt) / (2 * derivativeA),
    ].filter((t) => t > EPSILON && t < 1 - EPSILON);
}

/**
 * Evaluates one coordinate of a cubic Bézier curve.
 * @param {number} p0 The start coordinate.
 * @param {number} p1 The first control coordinate.
 * @param {number} p2 The second control coordinate.
 * @param {number} p3 The end coordinate.
 * @param {number} t The parameter along the curve.
 * @returns {number} The interpolated coordinate.
 */
function getCubicValue(p0, p1, p2, p3, t) {
    const inverse = 1 - t;

    return inverse * inverse * inverse * p0 +
        3 * inverse * inverse * t * p1 +
        3 * inverse * t * t * p2 +
        t * t * t * p3;
}

/**
 * Returns endpoints and extrema of a quadratic Bezier curve.
 * @param {number} startX Start X coordinate.
 * @param {number} startY Start Y coordinate.
 * @param {number} controlX Control X coordinate.
 * @param {number} controlY Control Y coordinate.
 * @param {number} endX End X coordinate.
 * @param {number} endY End Y coordinate.
 * @returns {Point[]} Points enclosing the drawn curve.
 */
export function getQuadraticBoundsPoints(startX, startY, controlX, controlY, endX, endY) {
    const ts = new Set([
        0,
        1,
        ...getQuadraticExtrema(startX, controlX, endX),
        ...getQuadraticExtrema(startY, controlY, endY),
    ]);

    return [...ts].map((t) => ({
        x: getQuadraticValue(startX, controlX, endX, t),
        y: getQuadraticValue(startY, controlY, endY, t),
    }));
}

/**
 * Finds interior parameters where a quadratic Bézier coordinate reaches an extremum.
 * @param {number} p0 The start coordinate.
 * @param {number} p1 The control coordinate.
 * @param {number} p2 The end coordinate.
 * @returns {number[]} The parameters strictly between zero and one.
 */
function getQuadraticExtrema(p0, p1, p2) {
    const denominator = p0 - 2 * p1 + p2;

    if (Math.abs(denominator) <= EPSILON) {
        return [];
    }

    const t = (p0 - p1) / denominator;

    return t > EPSILON && t < 1 - EPSILON ? [t] : [];
}

/**
 * Evaluates one coordinate of a quadratic Bézier curve.
 * @param {number} p0 The start coordinate.
 * @param {number} p1 The control coordinate.
 * @param {number} p2 The end coordinate.
 * @param {number} t The parameter along the curve.
 * @returns {number} The interpolated coordinate.
 */
function getQuadraticValue(p0, p1, p2, t) {
    const inverse = 1 - t;

    return inverse * inverse * p0 +
        2 * inverse * t * p1 +
        t * t * p2;
}

/**
 * Checks whether an angle lies within a directed arc sweep.
 * @param {number} startAngle The start angle in radians.
 * @param {number} endAngle The end angle in radians.
 * @param {number} angle The angle to check in radians.
 * @param {boolean} counterClockwise Whether the arc runs counterclockwise.
 * @returns {boolean} Whether the angle lies within the sweep, allowing for numerical tolerance.
 */
function isAngleWithinArc(startAngle, endAngle, angle, counterClockwise) {
    const start = normalizeAngle(startAngle);
    const target = normalizeAngle(angle);
    const sweep = getArcSweep(startAngle, endAngle, counterClockwise);

    if (sweep <= EPSILON) {
        return Math.abs(target - start) <= EPSILON;
    }

    let delta = counterClockwise ? start - target : target - start;

    if (delta < 0) {
        delta += TAU;
    }

    return delta <= sweep + EPSILON;
}

/**
 * Wraps an angle to one full revolution.
 * @param {number} angle The angle in radians.
 * @returns {number} The equivalent angle in the range [0, 2π).
 */
function normalizeAngle(angle) {
    const normalized = angle % TAU;

    return normalized < 0 ? normalized + TAU : normalized;
}

/**
 * Normalizes a coordinate vector when its length is nonzero.
 * @param {number} x The X component.
 * @param {number} y The Y component.
 * @returns {Point|null} The unit vector, or null when its length is within numerical tolerance of zero.
 */
function normalizeVector(x, y) {
    const length = Math.hypot(x, y);

    return length <= EPSILON ? null : {
        x: x / length,
        y: y / length,
    };
}

/**
 * Finds a point on a circle at the supplied angle.
 * @param {number} x The center X coordinate.
 * @param {number} y The center Y coordinate.
 * @param {number} radius The circle radius.
 * @param {number} angle The angle in radians.
 * @returns {Point} The point on the circle.
 */
function pointOnCircle(x, y, radius, angle) {
    return {
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
    };
}
