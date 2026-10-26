class ArcSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const path = this.context.createPath()
            .arc(300, 200, 100, 0, 1);

        this.context
            .background('#f1f5f9')
            .stroke('#111')
            .strokeWidth(2)
            .drawPath(path)
            .fill('#2563eb')
            .noStroke()
            .circle(300, 200, 10);
    }
}

class BezierSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const path = this.context.createPath()
            .bezier(50, 20, 400, 30, 150, 250, 450, 300);

        this.context
            .background('#f1f5f9')
            .stroke('#111')
            .strokeWidth(2)
            .drawPath(path)
            .noStroke()
            .fill('#2563eb')
            .circle(50, 20, 10)
            .circle(450, 300, 10)
            .fill('#e11d48')
            .circle(400, 30, 10)
            .circle(150, 250, 10);
    }
}

class CircleSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const path = this.context.createPath()
            .circle(300, 200, 100);

        this.context
            .background('#f1f5f9')
            .noStroke()
            .fill('#2563eb')
            .drawPath(path);
    }
}

class CurveSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const path = this.context.createPath()
            .curve(400, 20, 400, 200, 250, 50, 40);

        this.context
            .background('#f1f5f9')
            .stroke('#111')
            .strokeWidth(2)
            .drawPath(path)
            .noStroke()
            .fill('#2563eb')
            .circle(400, 20, 10)
            .fill('#e11d48')
            .circle(400, 200, 10)
            .circle(250, 50, 10);
    }
}

class EllipseSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const path = this.context.createPath()
            .ellipse(300, 200, 200, 100);

        this.context
            .background('#f1f5f9')
            .noStroke()
            .fill('#2563eb')
            .drawPath(path);
    }
}

class LineSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const path = this.context.createPath()
            .line(80, 100, 450, 200);

        this.context
            .background('#f1f5f9')
            .stroke('#111')
            .strokeWidth(2)
            .drawPath(path)
            .noStroke()
            .fill('#2563eb')
            .circle(80, 100, 10)
            .circle(450, 200, 10);
    }
}

class QuadSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const path = this.context.createPath()
            .quad(50, 20, 400, 30, 450, 300, 150, 250);

        this.context
            .background('#f1f5f9')
            .noStroke()
            .fill('#2563eb')
            .drawPath(path);
    }
}

class RectSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const path = this.context.createPath()
            .rect(100, 150, 400, 100);

        this.context
            .background('#f1f5f9')
            .noStroke()
            .fill('#2563eb')
            .drawPath(path);
    }
}

class SquareSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const path = this.context.createPath()
            .square(100, 50, 250);

        this.context
            .background('#f1f5f9')
            .noStroke()
            .fill('#2563eb')
            .drawPath(path);
    }
}

class TriangleSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const path = this.context.createPath()
            .triangle(50, 270, 300, 30, 450, 300);

        this.context
            .background('#f1f5f9')
            .noStroke()
            .fill('#2563eb')
            .drawPath(path);
    }
}

const arc = document.getElementById('arc');
const bezier = document.getElementById('bezier');
const circle = document.getElementById('circle');
const curve = document.getElementById('curve');
const ellipse = document.getElementById('ellipse');
const line = document.getElementById('line');
const quad = document.getElementById('quad');
const rect = document.getElementById('rect');
const square = document.getElementById('square');
const triangle = document.getElementById('triangle');

ArcSketch.attach(arc);
BezierSketch.attach(bezier);
CircleSketch.attach(circle);
CurveSketch.attach(curve);
EllipseSketch.attach(ellipse);
LineSketch.attach(line);
QuadSketch.attach(quad);
RectSketch.attach(rect);
SquareSketch.attach(square);
TriangleSketch.attach(triangle);
