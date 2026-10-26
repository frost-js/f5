const EPSILON = 1e-10;
const TAU = Math.PI * 2;
const CARDINAL_ANGLES = [
    0,
    Math.PI / 2,
    Math.PI,
    Math.PI * 1.5,
];

function normalizeAngle(angle) {
    const normalized = angle % TAU;

    return normalized < 0 ? normalized + TAU : normalized;
}

function getArcSweep(startAngle, endAngle, counterClockwise) {
    const start = normalizeAngle(startAngle);
    const end = normalizeAngle(endAngle);
    let sweep = counterClockwise ? start - end : end - start;

    if (sweep < 0) {
        sweep += TAU;
    }

    return sweep;
}

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

function pointOnCircle(x, y, radius, angle) {
    return {
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
    };
}

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

function getQuadraticValue(p0, p1, p2, t) {
    const inverse = 1 - t;

    return inverse * inverse * p0 +
        2 * inverse * t * p1 +
        t * t * p2;
}

function getQuadraticExtrema(p0, p1, p2) {
    const denominator = p0 - 2 * p1 + p2;

    if (Math.abs(denominator) <= EPSILON) {
        return [];
    }

    const t = (p0 - p1) / denominator;

    return t > EPSILON && t < 1 - EPSILON ? [t] : [];
}

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

function getCubicValue(p0, p1, p2, p3, t) {
    const inverse = 1 - t;

    return inverse * inverse * inverse * p0 +
        3 * inverse * inverse * t * p1 +
        3 * inverse * t * t * p2 +
        t * t * t * p3;
}

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

function normalizeVector(x, y) {
    const length = Math.hypot(x, y);

    return length <= EPSILON ? null : {
        x: x / length,
        y: y / length,
    };
}

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

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
    const inputDirection = normalizeVector(corner.x - start.x, corner.y - start.y);

    if (!inputDirection) {
        return null;
    }

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
