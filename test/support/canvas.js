import { createEventTarget } from './runtime.js';

/**
 * Creates a canvas double with attributes, styles, and events.
 * @param {object} [context=createRecordingContext()] The drawing context.
 * @param {object} [extra={}] Additional canvas properties.
 * @returns {object} The canvas double.
 */
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

/**
 * Creates a context that records drawing operations.
 * @returns {object} The recording context.
 */
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

