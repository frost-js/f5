class InputSketch extends F5.Canvas {
    onKeyDown(key) {
        writeStatus(this.context, `Key Down: ${key}`);
    }

    onKeyPress(key) {
        writeStatus(this.context, `Key Press: ${key}`);
    }

    onKeyUp(key) {
        writeStatus(this.context, `Key Up: ${key}`);
    }

    onMouseClick(button) {
        writeStatus(this.context, `Mouse Click: ${button}`);
    }

    onMouseDown(button) {
        writeStatus(this.context, `Mouse Down: ${button}`);
    }

    onMouseEnter() {
        writeStatus(this.context, 'Mouse Enter');
    }

    onMouseLeave() {
        writeStatus(this.context, 'Mouse Leave');
    }

    onMouseMove(x, y) {
        writeStatus(this.context, `Mouse Move: ${x} ${y}`);
    }

    onMouseUp(button) {
        writeStatus(this.context, `Mouse Up: ${button}`);
    }

    setup() {
        this.noLoop();

        writeStatus(this.context, 'Click here, then press a key');
    }
}

/**
 * Updates the input status and draws it on the canvas.
 * @param {F5.CanvasContext} context The drawing context.
 * @param {string} text The input status.
 */
function writeStatus(context, text) {
    document.getElementById('input-status').textContent = text;

    context
        .background('#f1f5f9')
        .fill('#000')
        .noStroke()
        .fontSize(24)
        .textAlign('center')
        .text(text, 300, 200);
}

const input = document.getElementById('input');

InputSketch.attach(input);
