const canvas = document.getElementById('seating-canvas');
const tableSelect = document.getElementById('table-select');
const availableOnly = document.getElementById('available-only');
const reserveButton = document.getElementById('reserve-table');
const status = document.getElementById('seating-status');

class SeatingPlan extends F5.Canvas {
    hovered = null;
    selected = 0;
    tables = [];

    onMouseClick() {
        const point = this.mousePos();
        const index = point ? this.tables.findIndex((table) =>
            (!availableOnly.checked || !table.reserved) && table.shape.containsPoint(point.x, point.y)) : -1;

        if (index !== -1) {
            this.selectTable(index);
        }
    }

    onMouseLeave() {
        this.hovered = null;
        canvas.style.cursor = 'default';
        this.render();
    }

    onMouseMove(x, y) {
        const index = this.tables.findIndex((table) =>
            (!availableOnly.checked || !table.reserved) && table.shape.containsPoint(x, y));

        if (index !== this.hovered) {
            this.hovered = index;
            canvas.style.cursor = index === -1 ? 'default' : 'pointer';
            this.render();
        }
    }

    render() {
        const context = this.context;

        context.background('#f8fafc').noStroke().fill('#fff').rect(24, 54, 752, 402)
            .fill('#dbeafe').rect(24, 80, 8, 340)
            .fill('#dcfce7').rect(768, 80, 8, 340)
            .font('sans-serif').fontSize(13).fontWeight('bold').textAlign('center').textBaseline('middle')
            .fill('#64748b').text('WINDOWS', 150, 29).text('DINING ROOM', 390, 29).text('COURTYARD', 630, 29)
            .fill('#f8fafc').rect(340, 442, 100, 38)
            .fill('#64748b').fontSize(11).text('ENTRANCE ↑', 390, 460);

        for (const [index, table] of this.tables.entries()) {
            const filtered = availableOnly.checked && table.reserved;
            const selected = index === this.selected;
            const hovered = index === this.hovered;
            const fill = table.reserved ? '#cbd5e1' : '#bfdbfe';
            const stroke = hovered ? '#2563eb' : '#94a3b8';

            context.fill(filtered ? '#f1f5f9' : fill).stroke(selected ? '#0f172a' : stroke)
                .strokeWidth(selected || hovered ? 3 : 1).drawShape(table.shape)
                .noStroke().fill(filtered ? '#94a3b8' : '#0f172a').fontSize(16).fontWeight('bold')
                .text(table.name, table.shape.x, table.shape.y - 6)
                .fontSize(10).fontWeight('normal')
                .text(`${table.seats} seats · ${table.reserved ? 'R' : 'A'}`, table.shape.x, table.shape.y + 12);
        }
    }

    reset() {
        for (const [index, table] of this.tables.entries()) {
            table.reserved = [1, 4, 7].includes(index);
        }

        availableOnly.checked = false;
        this.selected = 0;
        this.hovered = null;
        this.sync();
        this.render();
    }

    selectTable(index) {
        this.selected = index;
        this.sync();
        this.render();
        status.textContent = `${this.tables[index].name} selected. ${this.tables[index].reserved ? 'This table is already reserved.' : 'This table is available.'}`;
    }

    setup() {
        this.noLoop();

        for (let index = 0; index < 9; index++) {
            const column = index % 3;
            const row = Math.floor(index / 3);
            const seats = column === 1 ? 6 : 4;
            const angle = column === 2 ? Math.PI / 12 : 0;
            const shape = this.context.createShape(150 + column * 240, 120 + row * 130, angle)
                .layer((path) => path.rect(-38, -24, 76, 48));

            for (const x of [-22, 22]) {
                shape.layer((path) => path.rect(x - 10, -43, 20, 12));
                shape.layer((path) => path.rect(x - 10, 31, 20, 12));
            }

            if (seats === 6) {
                shape.layer((path) => path.rect(-57, -10, 12, 20));
                shape.layer((path) => path.rect(45, -10, 12, 20));
            }

            this.tables.push({
                name: `T${String(index + 1).padStart(2, '0')}`,
                reserved: false,
                seats,
                shape,
                zone: ['Window side', 'Central dining', 'Courtyard side'][column],
            });
        }

        const placeholder = document.createElement('option');

        placeholder.value = '';
        placeholder.textContent = 'Choose a table';
        tableSelect.append(placeholder);

        for (const [index, table] of this.tables.entries()) {
            const option = document.createElement('option');

            option.value = String(index);
            option.textContent = table.name;
            tableSelect.append(option);
        }

        this.reset();
    }

    sync() {
        const count = this.tables.filter((table) => !table.reserved).length;
        const table = this.tables[this.selected];

        document.getElementById('availability-count').textContent = `${count} of ${this.tables.length} tables available`;

        for (const [index, item] of this.tables.entries()) {
            const option = tableSelect.options[index + 1];

            option.textContent = `${item.name} · ${item.seats} seats · ${item.reserved ? 'Reserved' : 'Available'}`;
            option.disabled = availableOnly.checked && item.reserved;
        }

        tableSelect.value = table ? String(this.selected) : '';
        reserveButton.disabled = !table;
        reserveButton.textContent = table?.reserved ? 'Release reservation' : 'Reserve this table';
        document.getElementById('selected-table').textContent = table ? `Table ${table.name}` : 'No table selected';
        document.getElementById('table-details').textContent = table ? `${table.seats} guests · ${table.zone}` : 'Choose an available table on the map or in the selector.';

        const badge = document.getElementById('table-state');

        const state = table?.reserved ? 'Reserved' : 'Available';

        badge.textContent = table ? state : 'Select a table';
        badge.classList.toggle('bg-primary', Boolean(table && !table.reserved));
        badge.classList.toggle('bg-secondary', !table || table.reserved);
    }
}

const plan = new SeatingPlan(canvas, 800, 480);

plan.start();

tableSelect.addEventListener('change', () => {
    if (tableSelect.value !== '') {
        plan.selectTable(Number(tableSelect.value));
    } else {
        plan.selected = null;
        plan.sync();
        plan.render();
    }
});

availableOnly.addEventListener('change', () => {
    if (availableOnly.checked && plan.tables[plan.selected]?.reserved) {
        const index = plan.tables.findIndex((table) => !table.reserved);

        plan.selected = index === -1 ? null : index;
    }

    plan.hovered = null;
    plan.sync();
    plan.render();
    status.textContent = availableOnly.checked ? 'Reserved tables are muted and cannot be selected.' : 'Showing all tables.';
});

reserveButton.addEventListener('click', () => {
    const table = plan.tables[plan.selected];

    if (!table) {
        return;
    }

    table.reserved = !table.reserved;
    status.textContent = table.reserved ? `${table.name} reserved in this demo.` : `${table.name} is available again.`;

    if (availableOnly.checked && table.reserved) {
        plan.selected = null;
    }

    plan.sync();
    plan.render();
});

document.getElementById('reset-seating').addEventListener('click', () => {
    plan.reset();
    status.textContent = 'Original reservations restored. Table T01 is selected.';
});
