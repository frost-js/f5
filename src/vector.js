/**
 * Vector
 */
export default class Vector {
    /**
     * Create a new Vector.
     * @param {number} [x=0] The X position.
     * @param {number} [y=0] The Y position.
     * @return {Vector} A new Vector object.
     */
    static create(x = 0, y = 0) {
        return new this(x, y);
    }

    /**
     * Parse a Vector or X/Y co-ordinates.
     * @param {Vector|number} x A Vector, or the X position.
     * @param {number} [y] The Y position.
     * @return {Vector} The parsed Vector.
     */
    static parse(x = 0, y = 0) {
        if (x instanceof Vector) {
            return x;
        }

        return new this(x, y);
    }

    /**
     * Create a random Vector.
     * @return {Vector} A new Vector object.
     */
    static random() {
        return new this(Math.random(), Math.random());
    }

    /**
     * New Vector constructor.
     * @param {number} [x=0] The X position.
     * @param {number} [y=0] The Y position.
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    };

    /**
     * Add another Vector to the Vector.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @return {Vector} The Vector.
     */
    add(x, y) {
        const other = this.constructor.parse(x, y);

        this.x += other.x;
        this.y += other.y;

        return this;
    }

    /**
     * Calculate the angle to another Vector.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @return {number} The angle to the other Vector.
     */
    angleTo(x, y) {
        const other = this.constructor.parse(x, y);

        return other.getHeading() - this.getHeading();
    }

    /**
     * Clone the Vector.
     * @return {Vector} A new Vector.
     */
    clone() {
        return new this.constructor(this.x, this.y);
    }

    /**
     * Calculate the distance to another Vector.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @return {number} The distance to the other Vector.
     */
    distTo(x, y) {
        const other = this.constructor.parse(x, y);

        return Math.hypot(other.x - this.x, other.y - this.y);
    }

    /**
     * Divide the Vector by another.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @return {Vector} The Vector.
     */
    div(x, y) {
        const other = this.constructor.parse(x, y);

        this.x /= other.x;
        this.y /= other.y;

        return this;
    }

    /**
     * Calculate the dot product of the Vector with another.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @return {number} The dot product.
     */
    dot(x, y) {
        const other = this.constructor.parse(x, y);

        return this.x * other.x + this.y * other.y;
    }

    /**
     * Get the angle of the Vector.
     * @return {number} The angle.
     */
    getHeading() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Get the magnitude of the Vector.
     * @return {number} The magnitude.
     */
    getMag() {
        return Math.hypot(this.x, this.y);
    }

    /**
     * Limit the Vector magnitude.
     * @param {number} mag The magnitude.
     * @return {Vector} The Vector.
     */
    limit(mag) {
        if (this.getMag() <= mag) {
            return this;
        }

        return this.setMag(mag);
    }

    /**
     * Multiply the Vector by another.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @return {Vector} The Vector.
     */
    mult(x, y) {
        const other = this.constructor.parse(x, y);

        this.x *= other.x;
        this.y *= other.y;

        return this;
    }

    /**
     * Normalize the Vector magnitude.
     * @return {Vector} The Vector.
     */
    normalize() {
        return this.setMag(1);
    }

    /**
     * Rotate the Vector.
     * @param {number} angle The angle.
     * @return {Vector} The Vector.
     */
    rotate(angle) {
        angle += this.getHeading();

        const mag = this.getMag();

        this.x = Math.cos(angle) * mag;
        this.y = Math.sin(angle) * mag;

        return this;
    }

    /**
     * Set the angle of the Vector.
     * @param {number} angle The angle.
     * @return {Vector} The Vector.
     */
    setHeading(angle) {
        const mag = this.getMag();

        this.x = Math.cos(angle) * mag;
        this.y = Math.sin(angle) * mag;

        return this;
    }

    /**
     * Set the magnitude of the Vector.
     * @param {number} mag The magnitude.
     * @return {Vector} The Vector.
     */
    setMag(mag) {
        const angle = this.getHeading();

        this.x = Math.cos(angle) * mag;
        this.y = Math.sin(angle) * mag;

        return this;
    }

    /**
     * Subtract another Vector from the Vector.
     * @param {Vector|number} x The other Vector, or the X position.
     * @param {number} [y] The Y position.
     * @return {Vector} The Vector.
     */
    sub(x, y) {
        const other = this.constructor.parse(x, y);

        this.x -= other.x;
        this.y -= other.y;

        return this;
    }
}
