import {
    expect,
    test as base,
} from '@playwright/test';

export function stubGlobal(name, value) {
    const hadValue = Object.hasOwn(globalThis, name);
    const previous = globalThis[name];

    globalThis[name] = value;

    return () => {
        if (hadValue) {
            globalThis[name] = previous;
        } else {
            delete globalThis[name];
        }
    };
}

export function createEventTarget(extra = {}) {
    const listeners = new Map();
    const target = {
        addEventListener(type, callback) {
            const entries = listeners.get(type) ?? [];

            entries.push(callback);
            listeners.set(type, entries);
        },
        removeEventListener(type, callback) {
            const entries = listeners.get(type) ?? [];

            listeners.set(type, entries.filter((entry) => entry !== callback));
        },
        dispatch(type, event = {}) {
            for (const callback of [...(listeners.get(type) ?? [])]) {
                callback({
                    ...event,
                    currentTarget: target,
                    target: event.target ?? target,
                });
            }
        },
        ...extra,
    };

    return target;
}

export function createAnimationWindow(initialNow = 0) {
    let nextFrameId = 1;
    let now = initialNow;
    const callbacks = new Map();

    const runtime = createEventTarget({
        advanceTime(delta) {
            now += delta;
        },
        cancelAnimationFrame(frameId) {
            callbacks.delete(frameId);
        },
        now() {
            return now;
        },
        requestAnimationFrame(callback) {
            const frameId = nextFrameId;

            nextFrameId += 1;
            callbacks.set(frameId, callback);

            return frameId;
        },
        runFrame(frameId) {
            const callback = callbacks.get(frameId);

            callbacks.delete(frameId);

            if (callback) {
                callback(now);
            }
        },
        setNow(value) {
            now = value;
        },
    });

    runtime.eventTarget = runtime;

    return runtime;
}

export function createCanvasNode(context = createRecordingContext(), extra = {}) {
    return createEventTarget({
        getBoundingClientRect() {
            return {
                left: 10,
                top: 20,
            };
        },
        getContext() {
            return context;
        },
        setAttribute(name, value) {
            this[name] = String(value);
        },
        style: {
            setProperty() {},
        },
        ...extra,
    });
}

export function createRecordingContext() {
    return {
        operations: [],
        arc(...args) {
            this.operations.push(['arc', ...args]);
        },
        arcTo(...args) {
            this.operations.push(['arcTo', ...args]);
        },
        beginPath() {
            this.operations.push(['beginPath']);
        },
        bezierCurveTo(...args) {
            this.operations.push(['bezierCurveTo', ...args]);
        },
        clearRect(...args) {
            this.operations.push(['clearRect', ...args]);
        },
        closePath() {
            this.operations.push(['closePath']);
        },
        createLinearGradient(...args) {
            this.operations.push(['createLinearGradient', ...args]);

            return {};
        },
        createRadialGradient(...args) {
            this.operations.push(['createRadialGradient', ...args]);

            return {};
        },
        drawImage(...args) {
            this.operations.push(['drawImage', ...args]);
        },
        ellipse(...args) {
            this.operations.push(['ellipse', ...args]);
        },
        fill() {
            this.operations.push(['fill']);
        },
        fillText(...args) {
            this.operations.push(['fillText', ...args]);
        },
        getImageData(...args) {
            this.operations.push(['getImageData', ...args]);

            return {
                data: new Uint8ClampedArray(),
            };
        },
        lineTo(...args) {
            this.operations.push(['lineTo', ...args]);
        },
        moveTo(...args) {
            this.operations.push(['moveTo', ...args]);
        },
        putImageData(...args) {
            this.operations.push(['putImageData', ...args]);
        },
        quadraticCurveTo(...args) {
            this.operations.push(['quadraticCurveTo', ...args]);
        },
        rect(...args) {
            this.operations.push(['rect', ...args]);
        },
        resetTransform() {
            this.operations.push(['resetTransform']);
        },
        restore() {
            this.operations.push(['restore']);
        },
        rotate(...args) {
            this.operations.push(['rotate', ...args]);
        },
        save() {
            this.operations.push(['save']);
        },
        scale(...args) {
            this.operations.push(['scale', ...args]);
        },
        stroke() {
            this.operations.push(['stroke']);
        },
        strokeText(...args) {
            this.operations.push(['strokeText', ...args]);
        },
        transform(...args) {
            this.operations.push(['transform', ...args]);
        },
        translate(...args) {
            this.operations.push(['translate', ...args]);
        },
    };
}

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

export function createHitTestContext(result = false) {
    return {
        isPointInPath() {
            return result;
        },
    };
}

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
        attributes: {},
        getAttribute(name) {
            return this.attributes[name] ?? null;
        },
        getContext() {
            return context;
        },
        setAttribute(name, value) {
            this.attributes[name] = String(value);
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
        attributes: {},
        getAttribute(name) {
            return this.attributes[name] ?? null;
        },
        getContext() {
            return outerContext;
        },
        setAttribute(name, value) {
            this.attributes[name] = String(value);
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
                    attributes: {},
                    getAttribute(name) {
                        return this.attributes[name] ?? null;
                    },
                    getContext() {
                        return layerContext;
                    },
                    setAttribute(name, value) {
                        this.attributes[name] = String(value);
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

export { expect };

export const test = base.extend({
    animationWindow: async ({}, use) => {
        await use(createAnimationWindow());
    },
    canvasNode: async ({}, use) => {
        await use((context, extra) => createCanvasNode(context, extra));
    },
    hitTestContext: async ({}, use) => {
        await use((result) => createHitTestContext(result));
    },
    path2D: [async ({}, use) => {
        const Path2DStub = createPath2DStub();
        const restorePath2D = stubGlobal('Path2D', Path2DStub);

        try {
            await use(Path2DStub);
        } finally {
            restorePath2D();
        }
    }, {
        auto: true,
    }],
    pathRenderEnvironment: async ({}, use) => {
        const environment = createPathRenderEnvironment();
        const restoreDocument = stubGlobal('document', environment.document);

        try {
            await use(environment);
        } finally {
            restoreDocument();
        }
    },
    recordingContext: async ({}, use) => {
        await use(createRecordingContext());
    },
    shapeRenderEnvironment: async ({}, use) => {
        const environment = createShapeRenderEnvironment();
        const restoreDocument = stubGlobal('document', environment.document);

        try {
            await use(environment);
        } finally {
            restoreDocument();
        }
    },
});
