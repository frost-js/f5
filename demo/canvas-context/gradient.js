class LinearSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const gradient = this.context.linearGradient(300, 0, 300, 400);
        gradient.addColorStop(0, 'blue');
        gradient.addColorStop(.5, 'black');
        gradient.addColorStop(1, 'red');

        this.context
            .fill(gradient)
            .rect(0, 0, 600, 400);
    }
}

class RadialSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        const gradient = this.context.radialGradient(300, 200, 450, 300, 200, 100);
        gradient.addColorStop(0, 'blue');
        gradient.addColorStop(.5, 'black');
        gradient.addColorStop(1, 'red');

        this.context
            .fill(gradient)
            .rect(0, 0, 600, 400);
    }
}

const linearGradient = document.getElementById('linearGradient');
const radialGradient = document.getElementById('radialGradient');

LinearSketch.attach(linearGradient);
RadialSketch.attach(radialGradient);
