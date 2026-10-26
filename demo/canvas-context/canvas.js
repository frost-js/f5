class ApplyMatrixSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .stroke('red')
            .rect(100, 100, 100, 100)
            .applyMatrix(1, .2, .8, 1, 0, 0)
            .stroke('blue')
            .rect(100, 100, 100, 100);
    }
}

class BackgroundSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('red');
    }
}

class ClearSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .clear();
    }
}

class EraseSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .erase((path) => path.rect(100, 100, 100, 200));
    }
}

class PopSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('red')
            .noStroke()
            .push()
            .stroke('black')
            .fill('blue')
            .translate(200, 150)
            .rotate(45)
            .scale(2, 3)
            .pop()
            .rect(100, 100, 200, 100);
    }
}

class PushSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('red')
            .push()
            .noStroke()
            .fill('blue')
            .strokeWidth(2)
            .translate(200, 150)
            .rotate(45)
            .scale(2, 3)
            .rect(-100, -100, 200, 100);
    }
}

class ResetSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('red')
            .stroke('blue')
            .strokeWidth(5)
            .shadowBlur(10)
            .shadow('#000')
            .shadowOffset(10, 10)
            .translate(-100, -50)
            .rotate(45)
            .scale(2, 3)
            .reset()
            .rect(100, 100, 200, 100);
    }
}

class ResetMatrixSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
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
            .background('#aaa');
    }
}

class RotateSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .translate(300, 200)
            .push()
            .stroke('red')
            .translate(-100, -50)
            .rect(0, 0, 200, 100)
            .pop()
            .push()
            .translate(-100, -50)
            .rotate(45)
            .stroke('blue')
            .rect(0, 0, 200, 100)
            .pop();
    }
}

class ScaleSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .stroke('red')
            .rect(100, 50, 100, 50)
            .scale(2, 3)
            .stroke('blue')
            .rect(100, 50, 100, 50);
    }
}

class TranslateSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .stroke('red')
            .rect(100, 100, 200, 100)
            .translate(100, 50)
            .stroke('blue')
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
