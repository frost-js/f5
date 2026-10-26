class ApplyMatrixSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#f1f5f9')
            .stroke('#e11d48')
            .rect(100, 100, 100, 100)
            .applyMatrix(1, .2, .8, 1, 0, 0)
            .stroke('#2563eb')
            .rect(100, 100, 100, 100);
    }
}

class BackgroundSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#e11d48');
    }
}

class ClearSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#f1f5f9')
            .clear();
    }
}

class EraseSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#f1f5f9')
            .erase((path) => path.rect(100, 100, 100, 200));
    }
}

class PopSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#f1f5f9')
            .fill('#e11d48')
            .noStroke()
            .push()
            .stroke('#0f172a')
            .fill('#2563eb')
            .translate(200, 150)
            .rotate(Math.PI / 4)
            .scale(2, 3)
            .pop()
            .rect(100, 100, 200, 100);
    }
}

class PushSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#f1f5f9')
            .fill('#e11d48')
            .push()
            .noStroke()
            .fill('#2563eb')
            .strokeWidth(2)
            .translate(200, 150)
            .rotate(Math.PI / 4)
            .scale(2, 3)
            .rect(-100, -100, 200, 100);
    }
}

class ResetSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#f1f5f9')
            .fill('#e11d48')
            .stroke('#2563eb')
            .strokeWidth(5)
            .shadowBlur(10)
            .shadow('#000')
            .shadowOffset(10, 10)
            .translate(-100, -50)
            .rotate(Math.PI / 4)
            .scale(2, 3)
            .reset()
            .rect(100, 100, 200, 100);
    }
}

class ResetMatrixSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#f1f5f9')
            .applyMatrix(1, .2, .8, 1, 0, 0)
            .resetMatrix()
            .rect(100, 100, 100, 100);
    }
}

class ResizeSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .resize(100, 100)
            .background('#f1f5f9');
    }
}

class RotateSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#f1f5f9')
            .translate(300, 200)
            .push()
            .stroke('#e11d48')
            .translate(-100, -50)
            .rect(0, 0, 200, 100)
            .pop()
            .push()
            .translate(-100, -50)
            .rotate(Math.PI / 4)
            .stroke('#2563eb')
            .rect(0, 0, 200, 100)
            .pop();
    }
}

class ScaleSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#f1f5f9')
            .stroke('#e11d48')
            .rect(100, 50, 100, 50)
            .scale(2, 3)
            .stroke('#2563eb')
            .rect(100, 50, 100, 50);
    }
}

class TranslateSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#f1f5f9')
            .stroke('#e11d48')
            .rect(100, 100, 200, 100)
            .translate(100, 50)
            .stroke('#2563eb')
            .rect(100, 100, 200, 100);
    }
}

const applyMatrix = document.getElementById('applyMatrix');
const background = document.getElementById('background');
const clear = document.getElementById('clear');
const erase = document.getElementById('erase');
const pop = document.getElementById('pop');
const push = document.getElementById('push');
const reset = document.getElementById('reset');
const resetMatrix = document.getElementById('resetMatrix');
const resize = document.getElementById('resize');
const rotate = document.getElementById('rotate');
const scale = document.getElementById('scale');
const translate = document.getElementById('translate');

ApplyMatrixSketch.attach(applyMatrix);
BackgroundSketch.attach(background);
ClearSketch.attach(clear);
EraseSketch.attach(erase);
PopSketch.attach(pop);
PushSketch.attach(push);
ResetSketch.attach(reset);
ResetMatrixSketch.attach(resetMatrix);
ResizeSketch.attach(resize);
RotateSketch.attach(rotate);
ScaleSketch.attach(scale);
TranslateSketch.attach(translate);
