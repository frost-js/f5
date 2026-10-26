class ContainsPointSketch extends F5.Canvas {
    setup() {
        this.shape = this.context.createShape(0, 0, 0, 300, 200)
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

        this.force = F5.Vector.random();
        this.rotation = Math.random() / 2 + 0.5;
    }

    update(deltaTime, elapsedTime) {
        this.shape.x += this.force.x;
        this.shape.y += this.force.y;

        if (this.shape.x <= -150 || this.shape.x >= 150) {
            this.force.x *= -1;
        }

        if (this.shape.y <= -50 || this.shape.y >= 50) {
            this.force.y *= -1;
        }

        this.shape.angle = elapsedTime * this.rotation;

        const mousePos = this.mousePos();

        let color = 'blue';
        if (mousePos && this.shape.containsPoint(mousePos.x, mousePos.y)) {
            color = 'red';
        }

        this.context
            .background('#aaa')
            .noStroke()
            .fill(color)
            .drawShape(this.shape);
    }
}

const containsPoint = document.getElementById('containsPoint');

ContainsPointSketch.attach(containsPoint);
