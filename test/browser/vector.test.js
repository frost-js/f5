import { expect, test } from '#test';

test.describe('Vector', () => {
    test.describe('construction', () => {
        test('defaults to the origin', async ({ page }) => {
            const vector = await page.evaluate(() => F5.Vector.create());

            expect(vector.x).toBe(0);
            expect(vector.y).toBe(0);
        });

        test('parses coordinates', async ({ page }) => {
            const vector = await page.evaluate(() => F5.Vector.parse(3, 4));

            expect(vector.x).toBe(3);
            expect(vector.y).toBe(4);
        });

        test('preserves existing vectors when parsing', async ({ page }) => {
            const vector = await page.evaluateHandle(() => new F5.Vector(3, 4));

            expect(await vector.evaluate((vector) => F5.Vector.parse(vector) === vector)).toBe(true);
        });

        test('clones coordinates independently of the original', async ({ page }) => {
            const original = await page.evaluateHandle(() => F5.Vector.create(3, 4));
            const clone = await original.evaluateHandle((vector) => vector.clone());

            expect(await clone.evaluate((vector) => vector.x)).toBe(3);
            expect(await clone.evaluate((vector) => vector.y)).toBe(4);

            await clone.evaluate((vector) => vector.x = 8);

            expect(await clone.evaluate((vector) => vector.x)).toBe(8);
            expect(await original.evaluate((vector) => vector.x)).toBe(3);
        });

        test('creates random coordinates in the unit square', async ({ page }) => {
            const vector = await page.evaluate(() => F5.Vector.random());

            expect(vector.x).toBeGreaterThanOrEqual(0);
            expect(vector.x).toBeLessThan(1);
            expect(vector.y).toBeGreaterThanOrEqual(0);
            expect(vector.y).toBeLessThan(1);
        });
    });

    test.describe('arithmetic', () => {
        for (const { method, x, y } of [
            { method: 'add', x: 10, y: 15 },
            { method: 'sub', x: 6, y: 9 },
            { method: 'mult', x: 16, y: 36 },
            { method: 'div', x: 4, y: 4 },
        ]) {
            for (const input of ['coordinates', 'vector']) {
                test(`${method} accepts ${input} and updates the vector`, async ({ page }) => {
                    const vector = await page.evaluateHandle(() => new F5.Vector(8, 12));

                    expect(await vector.evaluate((vector, { method, input }) => {
                        const args = input === 'vector' ? [new F5.Vector(2, 3)] : [2, 3];

                        return vector[method](...args) === vector;
                    }, { method, input })).toBe(true);
                    expect(await vector.evaluate((vector) => vector.x)).toBe(x);
                    expect(await vector.evaluate((vector) => vector.y)).toBe(y);
                });
            }
        }
    });

    test.describe('geometry', () => {
        test('measures magnitude and heading', async ({ page }) => {
            const vector = await page.evaluateHandle(() => new F5.Vector(3, 4));

            expect(await vector.evaluate((vector) => vector.getMag())).toBe(5);
            expect(await vector.evaluate((vector) => vector.getHeading())).toBeCloseTo(Math.atan2(4, 3));
        });

        test('measures distance, angle, and dot product between vectors', async ({ page }) => {
            const vector = await page.evaluateHandle(() => new F5.Vector(3, 0));

            expect(await vector.evaluate((vector) => vector.distTo(new F5.Vector(0, 4)))).toBe(5);
            expect(await vector.evaluate((vector) => vector.angleTo(new F5.Vector(0, 4)))).toBeCloseTo(Math.PI / 2);
            expect(await vector.evaluate((vector) => vector.dot(2, 5))).toBe(6);
        });
    });

    test.describe('magnitude and rotation', () => {
        test('sets magnitude without changing direction', async ({ page }) => {
            const vector = await page.evaluate(() => new F5.Vector(3, 4).setMag(10));

            expect(vector.x).toBeCloseTo(6);
            expect(vector.y).toBeCloseTo(8);
        });

        test('normalizes to unit length without changing direction', async ({ page }) => {
            const vector = await page.evaluate(() => new F5.Vector(3, 4).normalize());

            expect(vector.x).toBeCloseTo(0.6);
            expect(vector.y).toBeCloseTo(0.8);
        });

        for (const { name, x, y, limit } of [
            { name: 'below', x: 3, y: 4, limit: 10 },
            { name: 'at', x: 3, y: 4, limit: 5 },
            { name: 'above', x: 6, y: 8, limit: 5 },
        ]) {
            test(`limits a vector ${name} the maximum magnitude`, async ({ page }) => {
                const vector = await page.evaluate(({ x, y, limit }) => {
                    return new F5.Vector(x, y).limit(limit);
                }, { x, y, limit });

                expect(vector.x).toBeCloseTo(3);
                expect(vector.y).toBeCloseTo(4);
            });
        }

        test('sets heading without changing magnitude', async ({ page }) => {
            const vector = await page.evaluate(() => new F5.Vector(3, 4).setHeading(Math.PI));

            expect(vector.x).toBeCloseTo(-5);
            expect(vector.y).toBeCloseTo(0);
        });

        test('rotates relative to the current heading', async ({ page }) => {
            const vector = await page.evaluate(() => new F5.Vector(0, 5).rotate(Math.PI / 2));

            expect(vector.x).toBeCloseTo(-5);
            expect(vector.y).toBeCloseTo(0);
        });
    });
});
