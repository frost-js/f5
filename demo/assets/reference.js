/**
 * Draws a cutout on a checkerboard so transparent pixels are visible.
 * @param {F5.CanvasContext} context The drawing context.
 */
function drawErase(context) {
    const layer = document.createElement('canvas');
    const foreground = new F5.CanvasContext(layer, context.width, context.height)
        .scale(context.width / 360, context.height / 220);

    for (let x = 0; x < 360; x += 20) {
        for (let y = 0; y < 220; y += 20) {
            context.noStroke().fill((x + y) % 40 ? '#f8fafc' : '#e2e8f0').rect(x, y, 20, 20);
        }
    }

    foreground.fill('#2563eb').noStroke().rect(40, 40, 280, 140)
        .erase((path) => path.circle(180, 110, 52));
    context.push().resetMatrix().drawImage(layer).pop();
}

/**
 * Draws a reusable cubic path and marks its endpoints.
 * @param {F5.CanvasContext} context The drawing context.
 */
function drawPaths(context) {
    const path = context.createPath().vertex(35, 150).bezierVertex(100, 0, 240, 220, 325, 70);

    context.noFill().stroke('#2563eb').strokeWidth(5).drawPath(path)
        .noStroke().fill('#0d9488').circle(35, 150, 7).circle(325, 70, 7);
}

/**
 * Combines filled primitives with an outlined triangle.
 * @param {F5.CanvasContext} context The drawing context.
 */
function drawPrimitives(context) {
    context.fill('#2563eb').noStroke().circle(80, 110, 42).rect(155, 68, 100, 84)
        .noFill().stroke('#0d9488').strokeWidth(4).triangle(250, 160, 295, 65, 335, 160);
}

/**
 * Composes a ring from a filled layer and an erasing contour.
 * @param {F5.CanvasContext} context The drawing context.
 */
function drawShapes(context) {
    const ring = context.createShape(180, 110)
        .layer((path) => path.circle(0, 0, 72))
        .contour((path) => path.circle(0, 0, 36));

    context.fill('#0d9488').noStroke().drawShape(ring);
}

/**
 * Places a text label on a gradient fill.
 * @param {F5.CanvasContext} context The drawing context.
 */
function drawStyles(context) {
    const gradient = context.linearGradient(30, 0, 330, 0);

    gradient.addColorStop(0, '#2563eb');
    gradient.addColorStop(1, '#0d9488');
    context.fill(gradient).noStroke().rect(30, 40, 300, 140)
        .fill('#fff').font('sans-serif').fontSize(32).fontWeight('bold')
        .textAlign('center').textBaseline('middle').text('Hello, canvas.', 180, 110);
}

/**
 * Shows a rotated rectangle beside its original outline.
 * @param {F5.CanvasContext} context The drawing context.
 */
function drawTransforms(context) {
    context.noFill().stroke('#94a3b8').strokeWidth(2).rect(120, 75, 120, 70)
        .push().translate(180, 110).rotate(Math.PI / 5)
        .noStroke().fill('#2563eb').rect(-60, -35, 120, 70).pop();
}

/** Redraws the examples at their displayed size and screen pixel density. */
function render() {
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);

    for (const [canvas, draw] of examples) {
        const width = Math.round(canvas.clientWidth * pixelRatio);
        const height = Math.round(width * 220 / 360);

        if (!width || !height) {
            continue;
        }

        const context = new F5.CanvasContext(canvas, width, height)
            .background('#f8fafc')
            .scale(width / 360, height / 220);

        draw(context);
    }
}

const examples = new Map([
    ['primitives', drawPrimitives],
    ['styles', drawStyles],
    ['transforms', drawTransforms],
    ['paths', drawPaths],
    ['shapes', drawShapes],
    ['erase', drawErase],
].map(([name, draw]) => [document.getElementById(`reference-${name}`), draw]));
const observer = new ResizeObserver(render);

for (const canvas of examples.keys()) {
    canvas.style.aspectRatio = '360 / 220';
    observer.observe(canvas);
}

window.addEventListener('resize', render);
