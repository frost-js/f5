/**
 * Creates an independent drawing context for one reference panel.
 * @param {string} name The reference panel name.
 * @returns {F5.CanvasContext} The drawing context.
 */
function createContext(name) {
    return new F5.CanvasContext(document.getElementById(`reference-${name}`), 360, 220)
        .background('#f8fafc');
}

/** Draws a cutout on a checkerboard so transparent pixels are visible. */
function drawErase() {
    const context = createContext('erase');
    const layer = document.createElement('canvas');
    const foreground = new F5.CanvasContext(layer, 360, 220);

    for (let x = 0; x < 360; x += 20) {
        for (let y = 0; y < 220; y += 20) {
            context.noStroke().fill((x + y) % 40 ? '#f8fafc' : '#e2e8f0').rect(x, y, 20, 20);
        }
    }

    foreground.fill('#2563eb').noStroke().rect(40, 40, 280, 140)
        .erase((path) => path.circle(180, 110, 52));
    context.drawImage(layer);
}

/** Draws a reusable cubic path and marks its endpoints. */
function drawPaths() {
    const context = createContext('paths');
    const path = context.createPath().vertex(35, 150).bezierVertex(100, 0, 240, 220, 325, 70);

    context.noFill().stroke('#2563eb').strokeWidth(5).drawPath(path)
        .noStroke().fill('#0d9488').circle(35, 150, 7).circle(325, 70, 7);
}

/** Combines filled primitives with an outlined triangle. */
function drawPrimitives() {
    const context = createContext('primitives');

    context.fill('#2563eb').noStroke().circle(80, 110, 42).rect(155, 68, 100, 84)
        .noFill().stroke('#0d9488').strokeWidth(4).triangle(250, 160, 295, 65, 335, 160);
}

/** Composes a ring from a filled layer and an erasing contour. */
function drawShapes() {
    const context = createContext('shapes');
    const ring = context.createShape(180, 110)
        .layer((path) => path.circle(0, 0, 72))
        .contour((path) => path.circle(0, 0, 36));

    context.fill('#0d9488').noStroke().drawShape(ring);
}

/** Places a text label on a gradient fill. */
function drawStyles() {
    const context = createContext('styles');
    const gradient = context.linearGradient(30, 0, 330, 0);

    gradient.addColorStop(0, '#2563eb');
    gradient.addColorStop(1, '#0d9488');
    context.fill(gradient).noStroke().rect(30, 40, 300, 140)
        .fill('#fff').font('sans-serif').fontSize(32).fontWeight('bold')
        .textAlign('center').textBaseline('middle').text('Hello, canvas.', 180, 110);
}

/** Shows a rotated rectangle beside its original outline. */
function drawTransforms() {
    const context = createContext('transforms');

    context.noFill().stroke('#94a3b8').strokeWidth(2).rect(120, 75, 120, 70)
        .push().translate(180, 110).rotate(Math.PI / 5)
        .noStroke().fill('#2563eb').rect(-60, -35, 120, 70).pop();
}

drawPrimitives();
drawStyles();
drawTransforms();
drawPaths();
drawShapes();
drawErase();
