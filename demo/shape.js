class ShapeLayersSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const shape = this.context.createShape()
            .layer((path) => {
                path.circle(300, 200, 150);
            })
            .layer((path) => {
                path.triangle(150, 300, 300, 25, 450, 300);
            })
            .contour((path) => {
                path.triangle(200, 275, 300, 75, 400, 275);
            })
            .layer((path) => {
                path.circle(300, 200, 50);
            })
            .contour((path) => {
                path.triangle(260, 225, 300, 150, 340, 225);
            });

        this.context
            .background('#aaa')
            .noStroke()
            .fill('blue')
            .drawShape(shape);
    }
}

class ShapeOffsetSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const shape = this.context.createShape(50, 50)
            .layer((path) => {
                path.circle(300, 200, 150);
            })
            .layer((path) => {
                path.triangle(150, 300, 300, 25, 450, 300);
            })
            .contour((path) => {
                path.triangle(200, 275, 300, 75, 400, 275);
            })
            .layer((path) => {
                path.circle(300, 200, 50);
            })
            .contour((path) => {
                path.triangle(260, 225, 300, 150, 340, 225);
            });

        this.context
            .background('#aaa')
            .noStroke()
            .fill('blue')
            .drawShape(shape);
    }
}

class ShapeRotationSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const shape = this.context.createShape(-50, -50, 1, 300, 200)
            .layer((path) => {
                path.circle(300, 200, 150);
            })
            .layer((path) => {
                path.triangle(150, 300, 300, 25, 450, 300);
            })
            .contour((path) => {
                path.triangle(200, 275, 300, 75, 400, 275);
            })
            .layer((path) => {
                path.circle(300, 200, 50);
            })
            .contour((path) => {
                path.triangle(260, 225, 300, 150, 340, 225);
            });

        this.context
            .background('#aaa')
            .noStroke()
            .fill('blue')
            .drawShape(shape);
    }
}

class ShapePositionSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const shape = this.context.createShape(-50, -50, 1, 300, 200)
            .layer((path) => {
                path.circle(300, 200, 150);
            })
            .layer((path) => {
                path.triangle(150, 300, 300, 25, 450, 300);
            })
            .contour((path) => {
                path.triangle(200, 275, 300, 75, 400, 275);
            })
            .layer((path) => {
                path.circle(300, 200, 50);
            })
            .contour((path) => {
                path.triangle(260, 225, 300, 150, 340, 225);
            });

        this.context
            .background('#aaa')
            .noStroke()
            .fill('blue')
            .drawShape(shape, 100, 100);
    }
}

const shapeLayers = document.getElementById('shapeLayers');
const shapeOffset = document.getElementById('shapeOffset');
const shapeRotation = document.getElementById('shapeRotation');
const shapePosition = document.getElementById('shapePosition');

ShapeLayersSketch.attach(shapeLayers);
ShapeOffsetSketch.attach(shapeOffset);
ShapeRotationSketch.attach(shapeRotation);
ShapePositionSketch.attach(shapePosition);
