class BezierSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .stroke('#111')
            .strokeWidth(2)
            .begin()
            .vertex(50, 20)
            .bezierVertex(400, 30, 150, 250, 450, 300)
            .end()
            .noStroke()
            .fill('blue')
            .circle(50, 20, 10)
            .circle(450, 300, 10)
            .fill('red')
            .circle(400, 30, 10)
            .circle(150, 250, 10);
    }
}

class CurveSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .stroke('#111')
            .strokeWidth(2)
            .begin()
            .vertex(400, 20)
            .curveVertex(400, 200, 250, 50, 40)
            .end()
            .noStroke()
            .fill('blue')
            .circle(400, 20, 10)
            .fill('red')
            .circle(400, 200, 10)
            .circle(250, 50, 10);
    }
}

class QuadraticSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .stroke('#111')
            .strokeWidth(2)
            .begin()
            .vertex(450, 50)
            .quadraticVertex(300, 350, 50, 50)
            .end()
            .noStroke()
            .fill('blue')
            .circle(450, 50, 10)
            .circle(50, 50, 10)
            .fill('red')
            .circle(300, 350, 10);
    }
}

class VertexSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('blue')
            .begin()
            .vertex(150, 300)
            .vertex(50, 150)
            .vertex(150, 50)
            .vertex(400, 100)
            .vertex(500, 250)
            .end(true);
    }
}

const bezierVertex = document.getElementById('bezierVertex');
const curveVertex = document.getElementById('curveVertex');
const quadraticVertex = document.getElementById('quadraticVertex');
const vertex = document.getElementById('vertex');

BezierSketch.attach(bezierVertex);
CurveSketch.attach(curveVertex);
QuadraticSketch.attach(quadraticVertex);
VertexSketch.attach(vertex);
