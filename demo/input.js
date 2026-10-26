class InputSketch extends F5.Canvas {
    _write(text) {
        console.log(text);

        this.context
            .background('#aaa')
            .fill('#000')
            .noStroke()
            .fontSize('24')
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

        this.context
            .background('#aaa');
    }
}

const input = document.getElementById('input');

InputSketch.attach(input);
