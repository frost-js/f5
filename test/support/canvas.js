import { createAnimationWindow, createEventTarget } from './runtime.js';

/**
 * Creates a canvas double with attributes, styles, and events.
 * @param {object} [context={}] The drawing context.
 * @param {object} [extra={}] Additional canvas properties.
 * @returns {object} The canvas double.
 */
export function createCanvasNode(context = {}, extra = {}) {
    return createEventTarget({
        ownerDocument: { defaultView: createAnimationWindow() },
        getBoundingClientRect() {
            return {
                left: 10,
                top: 20,
                width: this.width,
                height: this.height,
            };
        },
        getContext() {
            return context;
        },
        hasAttribute(name) {
            return Object.hasOwn(this, name);
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
