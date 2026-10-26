import { expect, test } from '@playwright/test';
import Vector from '../../src/vector.js';

test.describe('Vector', () => {
    test('creates a vector', () => {
        const vector = Vector.create(1, 2);

        expect(vector.x).toBe(1);
        expect(vector.y).toBe(2);
    });

    test('parses vectors and coordinates', () => {
        const original = Vector.create(1, 2);
        const parsed = Vector.parse(original);
        const created = Vector.parse(3, 4);

        expect(parsed).toBe(original);
        expect(created).toBeInstanceOf(Vector);
        expect(created.x).toBe(3);
        expect(created.y).toBe(4);
    });

    test('clones a vector', () => {
        const original = Vector.create(2, 4);
        const clone = original.clone();

        expect(clone).not.toBe(original);
        expect(clone.x).toBe(2);
        expect(clone.y).toBe(4);
    });

    test('creates random vectors from Math.random', () => {
        const originalRandom = Math.random;
        const values = [0.1, 0.7, 0.25, 0.9];
        let index = 0;

        Math.random = () => {
            const value = values[index];

            index += 1;

            return value;
        };

        try {
            const first = Vector.random();
            const second = Vector.random();

            expect(first.x).toBe(0.1);
            expect(first.y).toBe(0.7);
            expect(second.x).toBe(0.25);
            expect(second.y).toBe(0.9);
        } finally {
            Math.random = originalRandom;
        }
    });

    test('adds another vector', () => {
        const vector = Vector.create(1, 2);
        const result = vector.add(Vector.create(2, 3));

        expect(vector.x).toBe(3);
        expect(vector.y).toBe(5);
        expect(result).toBe(vector);
    });

    test('adds coordinates', () => {
        const vector = Vector.create(1, 2);
        const result = vector.add(2, 3);

        expect(vector.x).toBe(3);
        expect(vector.y).toBe(5);
        expect(result).toBe(vector);
    });

    test('calculates the angle to another vector', () => {
        const vector = Vector.create(1, 2);

        expect(vector.angleTo(Vector.create(2, 3))).toBeCloseTo(-0.12435499454676135);
        expect(vector.angleTo(2, 3)).toBeCloseTo(-0.12435499454676135);
    });

    test('calculates the distance to another vector', () => {
        const vector = Vector.create(1, 2);

        expect(vector.distTo(Vector.create(2, 3))).toBeCloseTo(1.4142135623730951);
        expect(vector.distTo(2, 3)).toBeCloseTo(1.4142135623730951);
    });

    test('divides by another vector', () => {
        const vector = Vector.create(1, 2);
        const result = vector.div(Vector.create(2, 3));

        expect(vector.x).toBeCloseTo(0.5);
        expect(vector.y).toBeCloseTo(0.6666666666666666);
        expect(result).toBe(vector);
    });

    test('calculates the dot product without mutating the vector', () => {
        const vector = Vector.create(1, 2);

        expect(vector.dot(Vector.create(2, 3))).toBe(8);
        expect(vector.dot(2, 3)).toBe(8);
        expect(vector.x).toBe(1);
        expect(vector.y).toBe(2);
    });

    test('gets heading and magnitude', () => {
        const vector = Vector.create(1, 2);

        expect(vector.getHeading()).toBeCloseTo(1.1071487177940904);
        expect(vector.getMag()).toBeCloseTo(2.23606797749979);
    });

    test('limits the magnitude when needed', () => {
        const vector = Vector.create(1, 2);
        const result = vector.limit(2);

        expect(vector.getMag()).toBeCloseTo(2);
        expect(result).toBe(vector);
    });

    test('does not limit the magnitude when already inside the limit', () => {
        const vector = Vector.create(1, 2);
        const result = vector.limit(3);

        expect(vector.getMag()).toBeCloseTo(2.23606797749979);
        expect(result).toBe(vector);
    });

    test('multiplies by another vector', () => {
        const vector = Vector.create(1, 2);
        const result = vector.mult(Vector.create(2, 3));

        expect(vector.x).toBe(2);
        expect(vector.y).toBe(6);
        expect(result).toBe(vector);
    });

    test('normalizes the magnitude', () => {
        const vector = Vector.create(1, 2);
        const result = vector.normalize();

        expect(vector.getMag()).toBeCloseTo(1);
        expect(result).toBe(vector);
    });

    test('rotates the vector', () => {
        const vector = Vector.create(1, 2);
        const result = vector.rotate(0.45);

        expect(vector.getHeading()).toBeCloseTo(1.5571487177940904);
        expect(result).toBe(vector);
    });

    test('sets heading and magnitude', () => {
        const vector = Vector.create(1, 2);

        expect(vector.setHeading(0.45)).toBe(vector);
        expect(vector.getHeading()).toBeCloseTo(0.45);
        expect(vector.setMag(3)).toBe(vector);
        expect(vector.getMag()).toBeCloseTo(3);
    });

    test('subtracts another vector', () => {
        const vector = Vector.create(1, 2);
        const result = vector.sub(Vector.create(2, 3));

        expect(vector.x).toBe(-1);
        expect(vector.y).toBe(-1);
        expect(result).toBe(vector);
    });
});
