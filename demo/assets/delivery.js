const canvas = document.getElementById('delivery-canvas');
const courierSelect = document.getElementById('courier-select');
const speedSelect = document.getElementById('playback-speed');
const playButton = document.getElementById('toggle-playback');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const routes = [
    {
        name: 'Market loop', color: '#2563eb', speed: 55,
        points: [[80, 80], [400, 80], [400, 240], [240, 240], [240, 400], [80, 400], [80, 80]],
        stops: ['Depot', 'North market', 'Bakery', 'Town square', 'South market', 'West gate', 'Depot'],
    },
    {
        name: 'Riverside loop', color: '#c2410c', speed: 45,
        points: [[720, 80], [560, 80], [560, 240], [720, 240], [720, 400], [400, 400], [400, 80], [720, 80]],
        stops: ['East depot', 'Library', 'Garden', 'Riverside café', 'East gate', 'South square', 'North market', 'East depot'],
    },
    {
        name: 'Studio loop', color: '#0d9488', speed: 65,
        points: [[80, 240], [240, 240], [240, 80], [560, 80], [560, 400], [240, 400], [240, 240], [80, 240]],
        stops: ['West depot', 'Town square', 'Studios', 'Library', 'South garden', 'South market', 'Town square', 'West depot'],
    },
];

/**
 * Finds a courier's position, heading, and next waypoint along its loop.
 * @param {object} route The route with its measured segments.
 * @param {number} time The elapsed simulation time in seconds.
 * @returns {object} The position, heading, next waypoint, and route progress.
 */
function getPosition(route, time) {
    const distance = (time * route.speed) % route.length;
    let remaining = distance;
    let index = 0;

    while (index < route.segments.length - 1 && remaining > route.segments[index].length) {
        remaining -= route.segments[index].length;
        index++;
    }

    const segment = route.segments[index];
    const fraction = remaining / segment.length;
    const direction = segment.end.clone().sub(segment.start);

    return {
        angle: direction.getHeading(),
        next: route.stops[index + 1],
        point: direction.mult(fraction, fraction).add(segment.start),
        progress: distance / route.length,
    };
}

class DeliveryMap extends F5.Canvas {
    background = null;
    elapsed = 0;
    lastReadout = -1;
    paused = motion.matches;
    routes = [];
    selected = 0;
    speed = 1;

    onKeyDown(code, event) {
        if (code === 'Space') {
            event.preventDefault();
            this.paused = !this.paused;
            this.syncControls();
        }
    }

    onMouseClick() {
        const point = this.mousePos();
        const index = point ? this.routes.findIndex((route) => route.position.point.distTo(point) <= 24) : -1;

        if (index !== -1) {
            this.selectCourier(index);
        }
    }

    onMouseLeave() {
        canvas.style.cursor = 'default';
    }

    onMouseMove(x, y) {
        canvas.style.cursor = this.routes.some((route) => route.position.point.distTo(x, y) <= 24) ? 'pointer' : 'default';
    }

    render() {
        const context = this.context;

        context.clear().drawImage(this.background);

        for (const [index, route] of this.routes.entries()) {
            route.position = getPosition(route, this.elapsed);

            const { angle, point } = route.position;

            if (index === this.selected) {
                context.noFill().stroke(route.color).strokeWidth(2).circle(point.x, point.y, 24);
            }

            context.push().translate(point.x, point.y).rotate(angle)
                .noStroke().fill('#334155').rect(-9, -11, 6, 22).rect(5, -11, 6, 22)
                .fill(route.color).rect(-15, -9, 30, 18)
                .fill('#fff').rect(5, -6, 6, 12).pop();

            const labelX = Math.max(65, Math.min(735, point.x));
            const labelY = point.y - 34;

            context.noStroke().fill('#fff').rect(labelX - 22, labelY - 12, 44, 24)
                .fill(route.color).font('sans-serif').fontSize(13).fontWeight('bold')
                .textAlign('center').textBaseline('middle').text(`0${index + 1}`, labelX, labelY);
        }
    }

    renderMap() {
        const context = new F5.CanvasContext(this.background, 800, 480);

        context.background('#e8eef3').noStroke();

        for (const [row, names] of [['MARKET', 'STUDIOS', 'LIBRARY', 'GARDEN'], ['WORKSHOPS', 'BAKERY', 'HOMES', 'RIVERSIDE']].entries()) {
            for (const [column, name] of names.entries()) {
                const x = 105 + column * 160;
                const y = 105 + row * 160;
                const park = name === 'GARDEN' || name === 'RIVERSIDE';

                context.fill(park ? '#d0e7d6' : '#d5dee8').rect(x, y, 110, 110)
                    .fill(park ? '#aed1b9' : '#c1cedb').rect(x + 12, y + 12, 86, 62)
                    .fill('#64748b').font('sans-serif').fontSize(10).fontWeight('bold')
                    .textAlign('center').textBaseline('middle').text(name, x + 55, y + 92);
            }
        }

        context.noFill().stroke('#fff').strokeWidth(34);

        for (const x of [80, 240, 400, 560, 720]) {
            context.line(x, 35, x, 445);
        }

        for (const y of [80, 240, 400]) {
            context.line(35, y, 765, y);
        }

        for (const [index, route] of this.routes.entries()) {
            context.stroke(route.color).strokeWidth(index === this.selected ? 5 : 2).drawPath(route.path);
        }

        context.noStroke().fill('#64748b').fontSize(11).fontWeight('normal').textAlign('left')
            .text('N ↑', 26, 22).text('F5 NEIGHBORHOOD / SIMULATED ROUTES', 26, 462);
    }

    reset() {
        this.elapsed = 0;
        this.lastReadout = -1;
        this.paused = motion.matches;
        this.selected = 0;
        this.speed = 1;
        this.renderMap();
        this.render();
        this.syncControls();
        this.syncReadout();
    }

    selectCourier(index) {
        this.selected = index;
        this.renderMap();
        this.render();
        this.syncControls();
        this.syncReadout();
    }

    setup() {
        this.background = document.createElement('canvas');
        this.routes = routes.map((route) => {
            const points = route.points.map(([x, y]) => F5.Vector.create(x, y));
            const path = this.context.createPath();
            const segments = points.slice(1).map((end, index) => ({
                start: points[index],
                end,
                length: points[index].distTo(end),
            }));

            for (const point of points) {
                path.vertex(point.x, point.y);
            }

            return { ...route, path, segments, length: segments.reduce((length, segment) => length + segment.length, 0) };
        });
        this.reset();
    }

    syncControls() {
        courierSelect.value = String(this.selected);
        speedSelect.value = String(this.speed);
        playButton.textContent = this.paused ? 'Play deliveries' : 'Pause';
        playButton.setAttribute('aria-pressed', String(this.paused));
        document.getElementById('delivery-status').textContent = this.paused ?
            'Playback paused. Select a courier to inspect its route.' :
            `Simulated playback running at ${this.speed}× speed. Space pauses when the map is focused.`;
    }

    syncReadout() {
        const route = this.routes[this.selected];
        const progress = Math.floor(route.position.progress * 100);

        document.getElementById('courier-name').textContent = `0${this.selected + 1} · ${route.name}`;
        document.getElementById('courier-next').textContent = route.position.next;
        document.getElementById('route-progress').value = progress;
        document.getElementById('progress-label').value = `${progress}%`;
    }

    update(deltaTime) {
        if (this.paused) {
            return;
        }

        this.elapsed += Math.min(deltaTime, 0.1) * this.speed;
        this.render();

        const tick = Math.floor(this.elapsed * 4);

        if (tick !== this.lastReadout) {
            this.lastReadout = tick;
            this.syncReadout();
        }
    }
}

const map = new DeliveryMap(canvas, 800, 480);

map.start();

courierSelect.addEventListener('change', () => map.selectCourier(Number(courierSelect.value)));
speedSelect.addEventListener('change', () => {
    map.speed = Number(speedSelect.value);
    map.syncControls();
});
playButton.addEventListener('click', () => {
    map.paused = !map.paused;
    map.syncControls();
});
document.getElementById('reset-delivery').addEventListener('click', () => map.reset());
