class ContourSketch extends F5.Canvas {
    setup() {
        this.paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.elapsedTime = 0;

        this.paths = [];
        this.shape = this.context.createShape(0, 0, 0, 300, 200)
            .layer((path) => {
                this.paths.push(path);
                path.circle(300, 200, 150);
            })
            .layer((path) => {
                this.paths.push(path);
                path.triangle(150, 300, 300, 25, 450, 300);
            })
            .contour((path) => {
                this.paths.push(path);
                path.triangle(200, 275, 300, 75, 400, 275);
            })
            .layer((path) => {
                this.paths.push(path);
                path.circle(300, 200, 50);
            })
            .contour((path) => {
                this.paths.push(path);
                path.triangle(260, 225, 300, 150, 340, 225);
            });

        this.force = F5.Vector.random();
        this.rotation = Math.random() / 2 + 0.5;
    }

    update(deltaTime) {
        if (!this.paused) {
            const step = Math.min(deltaTime, 1 / 15);

            this.elapsedTime += step;
            this.shape.x += this.force.x * step * 60;
            this.shape.y += this.force.y * step * 60;

            if (this.shape.x <= -150 || this.shape.x >= 150) {
                this.force.x *= -1;
            }

            if (this.shape.y <= -50 || this.shape.y >= 50) {
                this.force.y *= -1;
            }
        }

        this.shape.angle = this.elapsedTime * this.rotation;

        const mousePos = this.mousePos();

        let color = '#2563eb';
        if (mousePos && this.shape.containsPoint(mousePos.x, mousePos.y)) {
            color = '#e11d48';
        }

        this.context
            .background('#f1f5f9')
            .noStroke()
            .fill(color)
            .drawShape(this.shape)
            .push()
            .translate(this.shape.x, this.shape.y)
            .translate(this.shape.anchorX, this.shape.anchorY)
            .rotate(this.shape.angle)
            .translate(-this.shape.anchorX, -this.shape.anchorY)
            .noFill()
            .stroke('#d97706');

        for (const path of this.paths) {
            const { x, y, width, height } = path.getBoundingBox();

            this.context.rect(x, y, width, height);
        }

        const { x, y, width, height } = this.shape.getBoundingBox();

        this.context
            .pop()
            .noFill()
            .stroke('#059669')
            .rect(x, y, width, height);
    }
}

const container = document.getElementById('contour');
const pauseButton = document.getElementById('pause-animation');
const status = document.getElementById('animation-status');
let sketch = ContourSketch.attach(container);

function updateControls() {
    pauseButton.textContent = sketch.paused ? 'Resume animation' : 'Pause animation';
    pauseButton.setAttribute('aria-pressed', String(sketch.paused));
    status.textContent = sketch.paused ?
        'Animation paused. Move the pointer to inspect the shape.' :
        'Animation running. Move the pointer over the filled layers.';
}

pauseButton.addEventListener('click', () => {
    sketch.paused = !sketch.paused;
    updateControls();
});

document.getElementById('reset-animation').addEventListener('click', () => {
    sketch.destroy();
    container.replaceChildren();
    sketch = ContourSketch.attach(container);
    updateControls();
});

updateControls();
