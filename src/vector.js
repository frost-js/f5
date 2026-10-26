/**
 * Stores a mutable 2D vector with arithmetic and geometric operations.
 */
export default class Vector {
    /**
     * Creates a new Vector.
     * @param {number} [x=0] The X position.
     * @param {number} [y=0] The Y position.
     * @returns {Vector} A new Vector object.
     */
    static create(x = 0, y = 0) {
        return new this(x, y);
    }

    /**
     * Parses a Vector or X/Y coordinates.
     * @param {Vector|number} [x=0] A Vector, or the X position.
     * @param {number} [y=0] The Y position.
     * @returns {Vector} The parsed Vector.
     */
    static parse(x = 0, y = 0) {
        if (x instanceof Vector) {
            return x;
        }

        return new this(x, y);
    }

    /**
     * Creates a random Vector.
     * @returns {Vector} A new Vector object.
     */
    static random() {
        return new this(Math.random(), Math.random());
    }

    /**
     * Creates a Vector.
     * @param {number} [x=0] The X position.
     * @param {number} [y=0] The Y position.
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Adds another Vector to the Vector.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @returns {Vector} The Vector.
     */
    add(x, y) {
        const other = this.constructor.parse(x, y);

        this.x += other.x;
        this.y += other.y;

        return this;
    }

    /**
     * Calculates the angle to another Vector.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @returns {number} The angle to the other Vector.
     */
    angleTo(x, y) {
        const other = this.constructor.parse(x, y);

        return other.getHeading() - this.getHeading();
    }

    /**
     * Clones the Vector.
     * @returns {Vector} A new Vector.
     */
    clone() {
        const VectorClass = this.constructor;

        return new VectorClass(this.x, this.y);
    }

    /**
     * Calculates the distance to another Vector.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @returns {number} The distance to the other Vector.
     */
    distTo(x, y) {
        const other = this.constructor.parse(x, y);

        return Math.hypot(other.x - this.x, other.y - this.y);
    }

    /**
     * Divides the Vector by another.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @returns {Vector} The Vector.
     */
    div(x, y) {
        const other = this.constructor.parse(x, y);

        this.x /= other.x;
        this.y /= other.y;

        return this;
    }

    /**
     * Calculates the dot product of the Vector with another.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @returns {number} The dot product.
     */
    dot(x, y) {
        const other = this.constructor.parse(x, y);

        return this.x * other.x + this.y * other.y;
    }

    /**
     * Gets the angle of the Vector.
     * @returns {number} The angle.
     */
    getHeading() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Gets the magnitude of the Vector.
     * @returns {number} The magnitude.
     */
    getMag() {
        return Math.hypot(this.x, this.y);
    }

    /**
     * Limits the Vector magnitude.
     * @param {number} mag The magnitude.
     * @returns {Vector} The Vector.
     */
    limit(mag) {
        if (this.getMag() <= mag) {
            return this;
        }

        return this.setMag(mag);
    }

    /**
     * Multiplies the Vector by another.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @returns {Vector} The Vector.
     */
    mult(x, y) {
        const other = this.constructor.parse(x, y);

        this.x *= other.x;
        this.y *= other.y;

        return this;
    }

    /**
     * Normalizes the Vector magnitude.
     * @returns {Vector} The Vector.
     */
    normalize() {
        return this.setMag(1);
    }

    /**
     * Rotates the Vector.
     * @param {number} angle The angle.
     * @returns {Vector} The Vector.
     */
    rotate(angle) {
        angle += this.getHeading();

        const mag = this.getMag();

        this.x = Math.cos(angle) * mag;
        this.y = Math.sin(angle) * mag;

        return this;
    }

    /**
     * Sets the angle of the Vector.
     * @param {number} angle The angle.
     * @returns {Vector} The Vector.
     */
    setHeading(angle) {
        const mag = this.getMag();

        this.x = Math.cos(angle) * mag;
        this.y = Math.sin(angle) * mag;

        return this;
    }

    /**
     * Sets the magnitude of the Vector.
     * @param {number} mag The magnitude.
     * @returns {Vector} The Vector.
     */
    setMag(mag) {
        const angle = this.getHeading();

        this.x = Math.cos(angle) * mag;
        this.y = Math.sin(angle) * mag;

        return this;
    }

    /**
     * Subtracts another Vector from the Vector.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @returns {Vector} The Vector.
     */
    sub(x, y) {
        const other = this.constructor.parse(x, y);

        this.x -= other.x;
        this.y -= other.y;

        return this;
    }
}
