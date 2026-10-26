class InputSketch extends F5.Canvas {
    _write(text) {
        document.getElementById('input-status').textContent = text;

        this.context
            .background('#f1f5f9')
            .fill('#000')
            .noStroke()
            .fontSize(24)
            .textAlign('center')
            .text(text, 300, 200);
    }

    onKeyDown(key) {
        this._write(`Key Down: ${key}`);
    }

    onKeyPress(key) {
        this._write(`Key Press: ${key}`);
    }

    onKeyUp(key) {
        this._write(`Key Up: ${key}`);
    }

    onMouseClick(button) {
        this._write(`Mouse Click: ${button}`);
    }

    onMouseDown(button) {
        this._write(`Mouse Down: ${button}`);
    }

    onMouseEnter() {
        this._write('Mouse Enter');
    }

    onMouseLeave() {
        this._write('Mouse Leave');
    }

    onMouseMove(x, y) {
        this._write(`Mouse Move: ${x} ${y}`);
    }

    onMouseUp(button) {
        this._write(`Mouse Up: ${button}`);
    }

    setup() {
        this.noLoop();

        this._write('Click here, then press a key');
    }
}

const input = document.getElementById('input');

InputSketch.attach(input);
