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

/**
 * Creates a document and canvas for inspecting path renders.
 * @returns {object} The document, canvas, and recording context.
 */
export function createPathRenderEnvironment() {
    const context = {
        operations: [],
        fill(path) {
            this.operations.push(['fill', path]);
        },
        stroke(path) {
            this.operations.push(['stroke', path]);
        },
        translate(...args) {
            this.operations.push(['translate', ...args]);
        },
    };
    const canvas = {
        getContext() {
            return context;
        },
    };

    return {
        canvas,
        context,
        document: {
            createElement() {
                return canvas;
            },
        },
    };
}

/**
 * Creates recording canvases for a shape and its layers.
 * @returns {object} The document, outer context, and layer accessor.
 */
export function createShapeRenderEnvironment() {
    let createCount = 0;
    const outerContext = {
        operations: [],
        drawImage(...args) {
            this.operations.push(['drawImage', ...args]);
        },
        rotate(...args) {
            this.operations.push(['rotate', ...args]);
        },
        translate(...args) {
            this.operations.push(['translate', ...args]);
        },
    };
    const outerCanvas = {
        getContext() {
            return outerContext;
        },
    };
    const layerCanvases = [];

    return {
        document: {
            createElement() {
                if (!createCount) {
                    createCount += 1;

                    return outerCanvas;
                }

                const layerContext = {
                    operations: [],
                    fill(path) {
                        this.operations.push(['fill', path]);
                    },
                    stroke(path) {
                        this.operations.push(['stroke', path]);
                    },
                    translate(...args) {
                        this.operations.push(['translate', ...args]);
                    },
                };
                const layerCanvas = {
                    getContext() {
                        return layerContext;
                    },
                };

                createCount += 1;
                layerCanvases.push(layerCanvas);

                return layerCanvas;
            },
        },
        getLayerCanvas() {
            return layerCanvases[0];
        },
        outerContext,
    };
}

