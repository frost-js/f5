const canvas = document.getElementById('annotation-canvas');
const context = new F5.CanvasContext(canvas, 800, 480);
const background = document.createElement('canvas');
const imageContext = new F5.CanvasContext(background, 800, 480);
const tool = document.getElementById('annotation-tool');
const color = document.getElementById('annotation-color');
const width = document.getElementById('annotation-width');
const undoButton = document.getElementById('undo-mark');
const resetButton = document.getElementById('reset-annotation');
const downloadButton = document.getElementById('download-image');
const upload = document.getElementById('annotation-image');
const status = document.getElementById('annotation-status');
const sample = new Image();
let marks = [];
let current = null;
let pointer = null;
let imageVersion = 0;
let ready = false;

/** Cancels the unfinished mark without altering the undo history. */
function cancelMark() {
    const captured = pointer;

    pointer = null;
    current = null;

    if (captured !== null && canvas.hasPointerCapture(captured)) {
        canvas.releasePointerCapture(captured);
    }

    render();
}

/**
 * Draws one annotation from its stored points and style.
 * @param {object} mark The annotation points and drawing style.
 */
function drawMark(mark) {
    const start = mark.points[0];
    const end = mark.points.at(-1);

    context.push().noFill().stroke(mark.color).strokeWidth(mark.width);

    if (mark.tool === 'rectangle') {
        context.rect(Math.min(start.x, end.x), Math.min(start.y, end.y), Math.abs(end.x - start.x), Math.abs(end.y - start.y));
    } else if (mark.tool === 'arrow') {
        const direction = F5.Vector.create(end.x, end.y).sub(start.x, start.y);
        const head = Math.min(20 + mark.width, direction.getMag() / 2);

        context.line(start.x, start.y, end.x, end.y)
            .translate(end.x, end.y).rotate(direction.getHeading())
            .begin().vertex(-head, -head / 2).vertex(0, 0).vertex(-head, head / 2).end();
    } else if (mark.points.length === 1) {
        context.noStroke().fill(mark.color).circle(start.x, start.y, mark.width / 2);
    } else {
        context.begin();

        for (const point of mark.points) {
            context.vertex(point.x, point.y);
        }

        context.end();
    }

    context.pop();
}

/**
 * Converts pointer coordinates to the fixed drawing resolution.
 * @param {PointerEvent} event The pointer event.
 * @returns {{x: number, y: number}} The drawing coordinates.
 */
function position(event) {
    const bounds = canvas.getBoundingClientRect();

    return {
        x: Math.max(0, Math.min(800, (event.clientX - bounds.left) * 800 / bounds.width)),
        y: Math.max(0, Math.min(480, (event.clientY - bounds.top) * 480 / bounds.height)),
    };
}

/** Replays the current document; only finished marks enter undo history. */
function render() {
    context.clear().drawImage(background);

    for (const mark of marks) {
        drawMark(mark);
    }

    if (current) {
        drawMark(current);
    }

    undoButton.disabled = !marks.length;
    document.getElementById('annotation-count').textContent = `${marks.length} ${marks.length === 1 ? 'mark' : 'marks'} · 800 × 480 PNG`;
}

/** Restores the original image and two example annotations. */
function reset() {
    imageVersion += 1;
    cancelMark();
    showImage(sample);
    marks = [
        { tool: 'rectangle', color: '#e11d48', width: 4, points: [{ x: 497, y: 202 }, { x: 690, y: 382 }] },
        { tool: 'arrow', color: '#2563eb', width: 4, points: [{ x: 170, y: 350 }, { x: 290, y: 270 }] },
    ];
    upload.value = '';
    tool.value = 'arrow';
    color.value = '#e11d48';
    width.value = '4';
    document.getElementById('width-value').value = '4';
    status.textContent = 'Sample restored. Highlight a detail, or upload your own image.';
    render();
}

/**
 * Fits an image into the document without stretching it.
 * @param {HTMLImageElement} image The decoded image.
 */
function showImage(image) {
    const scale = Math.min(800 / image.naturalWidth, 480 / image.naturalHeight);
    const x = (800 - image.naturalWidth * scale) / 2;
    const y = (480 - image.naturalHeight * scale) / 2;

    imageContext.background('#f1f5f9').push().translate(x, y).scale(scale).drawImage(image).pop();
    ready = true;
    resetButton.disabled = !sample.naturalWidth;
    downloadButton.disabled = false;
}

/** Removes the latest completed mark. */
function undo() {
    cancelMark();

    if (marks.length) {
        marks.pop();
        status.textContent = 'Last mark removed.';
        render();
    }
}

/**
 * Extends a freehand stroke or updates the end of a geometric mark.
 * @param {PointerEvent} event The pointer event.
 */
function updateMark(event) {
    const point = position(event);

    if (current.tool === 'pen') {
        current.points.push(point);
    } else {
        current.points[1] = point;
    }
}

canvas.addEventListener('pointerdown', (event) => {
    if (!ready || pointer !== null || event.button !== 0) {
        return;
    }

    event.preventDefault();
    canvas.focus({ preventScroll: true });
    pointer = event.pointerId;
    current = { tool: tool.value, color: color.value, width: Number(width.value), points: [position(event)] };
    canvas.setPointerCapture(pointer);
    render();
});

canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointer) {
        updateMark(event);
        render();
    }
});

canvas.addEventListener('pointerup', (event) => {
    if (event.pointerId !== pointer) {
        return;
    }

    if (current.tool !== 'pen' || current.points.length > 1) {
        updateMark(event);
    }

    marks.push(current);
    current = null;
    pointer = null;
    canvas.releasePointerCapture(event.pointerId);
    status.textContent = 'Mark added. Undo removes the last mark.';
    render();
});

canvas.addEventListener('pointercancel', cancelMark);
canvas.addEventListener('lostpointercapture', () => {
    if (pointer !== null) {
        cancelMark();
    }
});
canvas.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
    } else if (event.key === 'Escape') {
        cancelMark();
    }
});

width.addEventListener('input', () => {
    document.getElementById('width-value').value = width.value;
});
undoButton.addEventListener('click', undo);
resetButton.addEventListener('click', reset);
downloadButton.addEventListener('click', () => {
    cancelMark();
    canvas.toBlob((blob) => {
        if (!blob) {
            status.textContent = 'The image could not be exported. Please try again.';
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'f5-annotation.png';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        status.textContent = 'PNG prepared for download.';
    });
});

upload.addEventListener('change', async () => {
    const file = upload.files[0];

    if (!file) {
        return;
    }

    const version = ++imageVersion;
    const image = new Image();
    const url = URL.createObjectURL(file);

    status.textContent = 'Loading your image…';
    image.src = url;

    try {
        await image.decode();

        if (version !== imageVersion) {
            return;
        }

        cancelMark();
        showImage(image);
        marks = [];
        status.textContent = 'Your image is ready. It stays on your device.';
        render();
    } catch {
        if (version === imageVersion) {
            status.textContent = 'That image could not be opened. Choose a PNG, JPEG, or WebP image.';
        }
    } finally {
        URL.revokeObjectURL(url);
    }
});

sample.addEventListener('load', () => {
    resetButton.disabled = false;

    if (imageVersion === 0) {
        reset();
    }
});
sample.addEventListener('error', () => {
    status.textContent = 'The sample could not be loaded. You can still upload your own image.';
});
// An embedded illustration also keeps PNG export available when opening the demo as a local file.
sample.src = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480">
    <rect width="800" height="480" fill="#f5f0e7"/>
    <rect y="370" width="800" height="110" fill="#d6c5af"/>
    <path d="M0 410h800M0 450h800M120 370l-40 110M340 370l-15 110M550 370l30 110M720 370l70 110" stroke="#c2af96" fill="none"/>
    <rect x="70" y="60" width="230" height="200" rx="4" fill="#fff"/>
    <rect x="82" y="72" width="206" height="176" fill="#d8e9ed"/>
    <path d="M82 190l70-65 55 40 81-90v173H82" fill="#b4c9b8"/>
    <path d="M185 72v176M82 160h206" stroke="#fff" stroke-width="8"/>
    <rect x="354" y="73" width="100" height="124" fill="#c59e78"/>
    <rect x="361" y="80" width="86" height="110" fill="#faf6ef"/>
    <circle cx="404" cy="120" r="22" fill="#d69b77"/>
    <path d="M374 173q30-60 60 0" fill="#607c70"/>
    <rect x="205" y="285" width="410" height="18" rx="5" fill="#8c644b"/>
    <path d="M235 303v110M580 303v110" stroke="#73503c" stroke-width="14"/>
    <rect x="319" y="211" width="133" height="76" rx="5" fill="#334155"/>
    <rect x="326" y="218" width="119" height="60" fill="#bdd9df"/>
    <path d="M307 287h156" stroke="#64748b" stroke-width="7"/>
    <rect x="480" y="269" width="32" height="16" rx="3" fill="#d97757"/>
    <path d="M512 273q15 0 0 9" fill="none" stroke="#d97757" stroke-width="4"/>
    <path d="M266 281v-71l22-17" fill="none" stroke="#334155" stroke-width="5"/>
    <path d="M270 199l28-22 20 25z" fill="#e8b75e"/>
    <rect x="341" y="324" width="117" height="66" rx="20" fill="#738e83"/>
    <path d="M355 382l-12 58M444 382l12 58" stroke="#455c52" stroke-width="8"/>
    <path d="M600 330v-100M600 280q-62-65-55-15 6 35 55 36M600 267q65-80 61-23-3 40-61 43M600 240q-26-75-38-38-6 27 38 60M600 232q34-75 44-37 7 23-44 53" fill="#6e9279" stroke="#52765d" stroke-width="3"/>
    <path d="M566 320h68l-12 66h-44z" fill="#c67f59"/>
    <text x="32" y="38" font-family="sans-serif" font-size="14" letter-spacing="2" fill="#59645c">STUDIO REFRESH / CONCEPT 02</text>
    <text x="32" y="460" font-family="sans-serif" font-size="12" fill="#735e49">A little more light. A place to make things.</text>
</svg>`)}`;
