import CanvasContext from './canvas-context.js';
import Vector from './vector.js';

/**
 * Canvas
 */
export default class Canvas {
    #cancelAnimationFrame;
    #destroyed;
    #eventTarget;
    #frameId;
    #keysDown;
    #listeners;
    #loop;
    #mouseDown;
    #mouseX;
    #mouseY;
    #node;
    #now;
    #previousTime;
    #requestAnimationFrame;
    #startTime;

    /**
     * Create a new Canvas with a new canvas element.
     * @param {HTMLElement} [parent] The parent node.
     * @param {number} [width=600] The canvas width.
     * @param {number} [height=400] The canvas height.
     * @param {object} [options] Additional canvas options.
     * @return {Canvas} A new Canvas object.
     */
    static attach(parent = document.body, width = 600, height = 400, options = {}) {
        const canvas = document.createElement('canvas');

        parent.append(canvas);

        return new this(canvas, width, height, options);
    }

    /**
     * New Canvas constructor.
     * @param {HTMLCanvasElement} node The canvas node.
     * @param {number} [width=600] The canvas width.
     * @param {number} [height=400] The canvas height.
     * @param {object} [options] Additional canvas options.
     * @param {object} [options.runtime] Runtime overrides for timing, events, and frame scheduling.
     */
    constructor(node, width = 600, height = 400, options = {}) {
        if (!node || typeof node.addEventListener !== 'function') {
            throw new TypeError('Canvas requires a canvas element.');
        }

        const runtime = options.runtime ?? {};

        this.#node = node;

        this.#destroyed = false;
        this.#eventTarget = runtime.eventTarget ?? globalThis.window;
        this.#cancelAnimationFrame = runtime.cancelAnimationFrame ??
            this.#eventTarget.cancelAnimationFrame.bind(this.#eventTarget);
        this.#frameId = null;
        this.#listeners = [];
        this.#loop = true;
        this.#mouseX = null;
        this.#mouseY = null;
        this.#mouseDown = new Set();
        this.#keysDown = new Set();
        this.#now = runtime.now ?? (() => globalThis.performance.now());
        this.#previousTime = null;
        this.#requestAnimationFrame = runtime.requestAnimationFrame ??
            this.#eventTarget.requestAnimationFrame.bind(this.#eventTarget);
        this.#startTime = null;

        this.context = new CanvasContext(this.#node, width, height);

        this.#node.setAttribute('tabindex', '1');
        this.#node.style.setProperty('outline', '0');

        this.#events();
        this.setup();

        const run = () => {
            if (this.#destroyed || !this.#loop) {
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
    }

    /**
     * Stop the loop and remove event listeners.
     * @return {Canvas} The Canvas.
     */
    destroy() {
        if (this.#destroyed) {
            return this;
        }

        this.noLoop();
        this.#destroyed = true;

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

        return this;
    }

    /**
     * Determine if a key is being pressed.
     * @param {string} code The key code.
     * @return {Boolean} TRUE if the key is being pressed, otherwise FALSE.
     */
    isKeyPressed(code) {
        return code ?
            this.#keysDown.has(code) :
            this.#keysDown.size > 0;
    }

    /**
     * Determine if a mouse button is being pressed.
     * @param {number} button The mouse button.
     * @return {Boolean} TRUE if the mouse button is being pressed, otherwise FALSE.
     */
    isMousePressed(button = 0) {
        return this.#mouseDown.has(button) && this.#mouseX !== null && this.#mouseY !== null;
    }

    /**
     * Get the mouse position.
     * @return {Vector|null} The mouse position.
     */
    mousePos() {
        if (this.#mouseX === null || this.#mouseY === null) {
            return null;
        }

        return new Vector(this.#mouseX, this.#mouseY);
    }

    /**
     * Stop the update method.
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
     */
    onKeyDown(_code, _event) {

    }

    /**
     * Key press callback.
     */
    onKeyPress(_key, _event) {

    }

    /**
     * Key up callback.
     */
    onKeyUp(_code, _event) {

    }

    /**
     * Mouse click callback.
     */
    onMouseClick(_button, _event) {

    }

    /**
     * Mouse down callback.
     */
    onMouseDown(_button, _event) {

    }

    /**
     * Mouse enter callback.
     */
    onMouseEnter(_event) {

    }

    /**
     * Mouse leave callback.
     */
    onMouseLeave(_event) {

    }

    /**
     * Mouse move callback.
     */
    onMouseMove(_x, _y, _event) {

    }

    /**
     * Mouse up callback.
     */
    onMouseUp(_button, _event) {

    }

    /**
     * Setup callback.
     */
    setup() {

    }

    /**
     * Update callback.
     * @param {number} _deltaTime The time elapsed since the previous frame in seconds.
     * @param {number} _elapsedTime The total time elapsed since the loop started in seconds.
     */
    update(_deltaTime, _elapsedTime) {

    }

    /**
     * Add an event listener and track it for cleanup.
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
     * Attach events for the Canvas.
     */
    #events() {
        const updateMouse = (e) => {
            if (
                e.target === this.#node &&
                Number.isFinite(e.offsetX) &&
                Number.isFinite(e.offsetY)
            ) {
                this.#mouseX = e.offsetX;
                this.#mouseY = e.offsetY;

                return;
            }

            if (Number.isFinite(e.clientX) && Number.isFinite(e.clientY)) {
                const bounds = this.#node.getBoundingClientRect();

                this.#mouseX = e.clientX - bounds.left;
                this.#mouseY = e.clientY - bounds.top;
            }
        };

        this.#addEventListener(this.#eventTarget, 'mouseup', (e) => {
            if (!this.#mouseDown.has(e.button)) {
                return;
            }

            this.#mouseDown.delete(e.button);

            updateMouse(e);

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
            updateMouse(e);

            this.onMouseEnter(e);
        });

        this.#addEventListener(this.#node, 'mouseleave', (e) => {
            updateMouse(e);

            this.onMouseLeave(e);

            this.#mouseX = null;
            this.#mouseY = null;
        });

        this.#addEventListener(this.#node, 'mousemove', (e) => {
            updateMouse(e);

            this.onMouseMove(this.#mouseX, this.#mouseY, e);
        });

        this.#addEventListener(this.#node, 'mousedown', (e) => {
            this.#mouseDown.add(e.button);

            updateMouse(e);

            this.onMouseDown(e.button, e);
        });

        this.#addEventListener(this.#node, 'click', (e) => {
            updateMouse(e);

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
}
