/**
 * Replaces a global until the returned cleanup function is called.
 * @param {string} name The global property name.
 * @param {*} value The replacement value.
 * @returns {function(): void} Restores the original global.
 */
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

/**
 * Creates a synchronous event target for lifecycle tests.
 * @param {object} [extra={}] Additional properties for the target.
 * @returns {object} The dispatchable event target.
 */
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

/**
 * Creates a manually advanced clock and frame scheduler.
 * @param {number} [initialNow=0] Initial time in milliseconds.
 * @returns {object} The runtime with controllable time and events.
 */
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

