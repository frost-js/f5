import CanvasContext from './canvas-context.js';
import Vector from './vector.js';

/**
 * @typedef {object} CanvasRuntime
 * @property {Window|EventTarget} [eventTarget] Target for global input and default animation scheduling.
 * @property {function(): number} [now] Monotonic clock returning milliseconds.
 * @property {function(FrameRequestCallback): number} [requestAnimationFrame] Schedules a frame.
 * @property {function(number): void} [cancelAnimationFrame] Cancels a scheduled frame.
 */

/**
 * @typedef {object} CanvasOptions
 * @property {CanvasRuntime} [runtime] Overrides for timing, frame scheduling, and input events.
 */

/**
 * Manages a canvas animation lifecycle and keyboard and mouse input.
 */
export default class Canvas {
    #cancelAnimationFrame;
    #disposed = false;
    #eventTarget;
    #frameId = null;
    #keysDown = new Set();
    #listeners = [];
    #loop = true;
    #mouseDown = new Set();
    #mouseX = null;
    #mouseY = null;
    #node;
    #now;
    #previousTime = null;
    #requestAnimationFrame;
    #started = false;
    #startTime = null;

    /**
     * Creates a canvas element and starts a fully constructed Canvas.
     * @param {HTMLElement} [parent=document.body] The parent node.
     * @param {number} [width=600] The canvas width.
     * @param {number} [height=400] The canvas height.
     * @param {CanvasOptions} [options={}] Additional canvas options.
     * @returns {Canvas} A new Canvas object.
     */
    static attach(parent = document.body, width = 600, height = 400, options = {}) {
        const canvas = parent.ownerDocument.createElement('canvas');

        parent.append(canvas);

        try {
            const sketch = new this(canvas, width, height, options);

            return sketch.start();
        } catch (error) {
            canvas.remove();
            throw error;
        }
    }

    /**
     * Creates a Canvas without starting input or lifecycle hooks.
     * @param {HTMLCanvasElement} node The canvas node.
     * @param {number} [width=600] The canvas width.
     * @param {number} [height=400] The canvas height.
     * @param {CanvasOptions} [options={}] Additional canvas options.
     * @throws {TypeError} When the node does not provide canvas and event APIs.
     */
    constructor(node, width = 600, height = 400, options = {}) {
        if (!node || typeof node.addEventListener !== 'function') {
            throw new TypeError('Canvas requires a canvas element.');
        }

        const runtime = options.runtime ?? {};
        const view = node.ownerDocument?.defaultView ?? globalThis.window;
        const clock = view?.performance ?? globalThis.performance;

        this.#node = node;
        this.#eventTarget = runtime.eventTarget ?? view;
        this.#cancelAnimationFrame = runtime.cancelAnimationFrame ??
            this.#eventTarget.cancelAnimationFrame.bind(this.#eventTarget);
        this.#now = runtime.now ?? (() => clock.now());
        this.#requestAnimationFrame = runtime.requestAnimationFrame ??
            this.#eventTarget.requestAnimationFrame.bind(this.#eventTarget);

        this.context = new CanvasContext(this.#node, width, height);

        if (!this.#node.hasAttribute('tabindex')) {
            this.#node.setAttribute('tabindex', '0');
        }
    }

    /**
     * Stops the loop, removes event listeners, and clears input state.
     */
    dispose() {
        if (this.#disposed) {
            return;
        }

        this.noLoop();
        this.#disposed = true;

        for (const { listener, target, type } of this.#listeners) {
            if (typeof target.removeEventListener === 'function') {
                target.removeEventListener(type, listener);
            }
        }

        this.#listeners = [];

        this.#mouseDown.clear();
        this.#keysDown.clear();
        this.#mouseX = null;
        this.#mouseY = null;
    }

    /**
     * Determines if a key is being pressed.
     * @param {string} [code] The physical key code; omit to check any pressed key.
     * @returns {boolean} Whether a matching key is pressed.
     */
    isKeyPressed(code) {
        return code ?
            this.#keysDown.has(code) :
            this.#keysDown.size > 0;
    }

    /**
     * Determines if a mouse button is being pressed.
     * @param {number} [button=0] The mouse button.
     * @returns {boolean} Whether the button is pressed while the pointer is inside the canvas.
     */
    isMousePressed(button = 0) {
        return this.#mouseDown.has(button) && this.#mouseX !== null && this.#mouseY !== null;
    }

    /**
     * Gets the mouse position.
     * @returns {Vector|null} The mouse position.
     */
    mousePos() {
        if (this.#mouseX === null || this.#mouseY === null) {
            return null;
        }

        return new Vector(this.#mouseX, this.#mouseY);
    }

    /**
     * Stops the update method.
     */
    noLoop() {
        this.#loop = false;

        if (this.#frameId !== null && typeof this.#cancelAnimationFrame === 'function') {
            this.#cancelAnimationFrame(this.#frameId);
        }

        this.#frameId = null;
    }

    /**
     * Key down callback.
     * @param {string} _code The physical keyboard code.
     * @param {KeyboardEvent} _event The native browser event.
     */
    onKeyDown(_code, _event) {

    }

    /**
     * Key press callback.
     * @param {string} _key The typed key value.
     * @param {KeyboardEvent} _event The native browser event.
     */
    onKeyPress(_key, _event) {

    }

    /**
     * Key up callback.
     * @param {string} _code The physical keyboard code.
     * @param {KeyboardEvent} _event The native browser event.
     */
    onKeyUp(_code, _event) {

    }

    /**
     * Mouse click callback.
     * @param {number} _button The mouse button index.
     * @param {MouseEvent} _event The native browser event.
     */
    onMouseClick(_button, _event) {

    }

    /**
     * Mouse down callback.
     * @param {number} _button The mouse button index.
     * @param {MouseEvent} _event The native browser event.
     */
    onMouseDown(_button, _event) {

    }

    /**
     * Mouse enter callback.
     * @param {MouseEvent} _event The native browser event.
     */
    onMouseEnter(_event) {

    }

    /**
     * Mouse leave callback.
     * @param {MouseEvent} _event The native browser event.
     */
    onMouseLeave(_event) {

    }

    /**
     * Mouse move callback.
     * @param {number} _x The canvas-local X coordinate.
     * @param {number} _y The canvas-local Y coordinate.
     * @param {MouseEvent} _event The native browser event.
     */
    onMouseMove(_x, _y, _event) {

    }

    /**
     * Mouse up callback.
     * @param {number} _button The mouse button index.
     * @param {MouseEvent} _event The native browser event.
     */
    onMouseUp(_button, _event) {

    }

    /**
     * Initializes sketch state once during start(), before the first update.
     */
    setup() {

    }

    /**
     * Starts input, setup, and updates once after construction.
     * @returns {Canvas} The Canvas; repeated calls and calls after disposal do nothing.
     */
    start() {
        if (this.#started || this.#disposed) {
            return this;
        }

        this.#started = true;

        try {
            this.#events();
            this.setup();

            const run = () => {
                if (this.#disposed || !this.#loop) {
                    return;
                }

                const now = this.#now();

                if (this.#startTime === null) {
                    this.#startTime = now;
                }

                const deltaTime = this.#previousTime === null ?
                    0 :
                    (now - this.#previousTime) / 1000;
                const elapsedTime = (now - this.#startTime) / 1000;

                this.#previousTime = now;

                this.update(deltaTime, elapsedTime);

                if (!this.#loop) {
                    return;
                }

                this.#frameId = this.#requestAnimationFrame(() => {
                    this.#frameId = null;

                    run();
                });
            };

            run();
        } catch (error) {
            this.dispose();
            throw error;
        }

        return this;
    }

    /**
     * Updates callback.
     * @param {number} _deltaTime The time elapsed since the previous frame in seconds.
     * @param {number} _elapsedTime The total time elapsed since the loop started in seconds.
     */
    update(_deltaTime, _elapsedTime) {

    }

    /**
     * Adds an event listener and track it for cleanup.
     * @param {EventTarget} target The event target.
     * @param {string} type The event type.
     * @param {Function} listener The event listener.
     */
    #addEventListener(target, type, listener) {
        target.addEventListener(type, listener);
        this.#listeners.push({
            listener,
            target,
            type,
        });
    }

    /**
     * Attaches events for the Canvas.
     */
    #events() {
        this.#addEventListener(this.#eventTarget, 'mouseup', (e) => {
            if (!this.#mouseDown.has(e.button)) {
                return;
            }

            this.#mouseDown.delete(e.button);

            this.#updateMouse(e);

            this.onMouseUp(e.button, e);
        });

        this.#addEventListener(this.#eventTarget, 'keyup', (e) => {
            if (!this.#keysDown.has(e.code)) {
                return;
            }

            this.#keysDown.delete(e.code);

            this.onKeyUp(e.code, e);
        });

        this.#addEventListener(this.#node, 'mouseenter', (e) => {
            this.#updateMouse(e);

            this.onMouseEnter(e);
        });

        this.#addEventListener(this.#node, 'mouseleave', (e) => {
            this.#updateMouse(e);

            this.onMouseLeave(e);

            this.#mouseX = null;
            this.#mouseY = null;
        });

        this.#addEventListener(this.#node, 'mousemove', (e) => {
            this.#updateMouse(e);

            if (this.#mouseX !== null && this.#mouseY !== null) {
                this.onMouseMove(this.#mouseX, this.#mouseY, e);
            }
        });

        this.#addEventListener(this.#node, 'mousedown', (e) => {
            this.#mouseDown.add(e.button);

            this.#updateMouse(e);

            this.onMouseDown(e.button, e);
        });

        this.#addEventListener(this.#node, 'click', (e) => {
            this.#updateMouse(e);

            this.onMouseClick(e.button, e);
        });

        this.#addEventListener(this.#node, 'keydown', (e) => {
            this.#keysDown.add(e.code);

            this.onKeyDown(e.code, e);

            if (!e.repeat && typeof e.key === 'string' && e.key.length === 1) {
                this.onKeyPress(e.key, e);
            }
        });
    }

    /**
     * Updates the canvas-local mouse coordinates from an event.
     * @param {MouseEvent} event The mouse event.
     */
    #updateMouse(event) {
        const bounds = this.#node.getBoundingClientRect();

        if (
            !bounds.width ||
            !bounds.height ||
            !Number.isFinite(event.clientX) ||
            !Number.isFinite(event.clientY)
        ) {
            this.#mouseX = null;
            this.#mouseY = null;

            return;
        }

        this.#mouseX = (event.clientX - bounds.left) * this.context.width / bounds.width;
        this.#mouseY = (event.clientY - bounds.top) * this.context.height / bounds.height;
    }
}
