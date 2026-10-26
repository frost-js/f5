/**
 * Creates a Path2D constructor for geometry-only tests.
 * @returns {Function} The inert path constructor.
 */
export function createPath2DStub() {
    return class Path2DStub {
        arc() {}

        arcTo() {}

        bezierCurveTo() {}

        closePath() {}

        ellipse() {}

        lineTo() {}

        moveTo() {}

        quadraticCurveTo() {}

        rect() {}
    };
}

/**
 * Creates a context with a predetermined hit-test result.
 * @param {boolean} [result=false] The containment result.
 * @returns {object} The hit-test context.
 */
export function createHitTestContext(result = false) {
    return {
        isPointInPath() {
            return result;
        },
    };
}
