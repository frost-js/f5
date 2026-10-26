// src/path-bounds.js
var EPSILON = 1e-10;
var TAU = Math.PI * 2;
var CARDINAL_ANGLES = [
	0,
	Math.PI / 2,
	Math.PI,
	Math.PI * 1.5
];
function normalizeAngle(angle) {
	const normalized = angle % TAU;
	return normalized < 0 ? normalized + TAU : normalized;
}
function getArcSweep(startAngle, endAngle, counterClockwise) {
	const start = normalizeAngle(startAngle);
	const end = normalizeAngle(endAngle);
	let sweep = counterClockwise ? start - end : end - start;
	if (sweep < 0) sweep += TAU;
	return sweep;
}
function isAngleWithinArc(startAngle, endAngle, angle, counterClockwise) {
	const start = normalizeAngle(startAngle);
	const target = normalizeAngle(angle);
	const sweep = getArcSweep(startAngle, endAngle, counterClockwise);
	if (sweep <= EPSILON) return Math.abs(target - start) <= EPSILON;
	let delta = counterClockwise ? start - target : target - start;
	if (delta < 0) delta += TAU;
	return delta <= sweep + EPSILON;
}
function pointOnCircle(x, y, radius, angle) {
	return {
		x: x + Math.cos(angle) * radius,
		y: y + Math.sin(angle) * radius
	};
}
/**
* Returns endpoints and cardinal extrema along a circular arc.
* @param {number} x Center X coordinate.
* @param {number} y Center Y coordinate.
* @param {number} radius Circle radius.
* @param {number} startAngle Start angle in radians.
* @param {number} endAngle End angle in radians.
* @param {boolean} [counterClockwise=false] Whether the arc runs counterclockwise.
* @returns {Array<{x: number, y: number}>} Points enclosing the drawn curve.
*/
function getArcBoundsPoints(x, y, radius, startAngle, endAngle, counterClockwise = false) {
	const points = [pointOnCircle(x, y, radius, startAngle), pointOnCircle(x, y, radius, endAngle)];
	if (Math.abs(endAngle - startAngle) >= TAU - EPSILON) {
		for (const angle of CARDINAL_ANGLES) points.push(pointOnCircle(x, y, radius, angle));
		return points;
	}
	for (const angle of CARDINAL_ANGLES) if (isAngleWithinArc(startAngle, endAngle, angle, counterClockwise)) points.push(pointOnCircle(x, y, radius, angle));
	return points;
}
function getQuadraticValue(p0, p1, p2, t) {
	const inverse = 1 - t;
	return inverse * inverse * p0 + 2 * inverse * t * p1 + t * t * p2;
}
function getQuadraticExtrema(p0, p1, p2) {
	const denominator = p0 - 2 * p1 + p2;
	if (Math.abs(denominator) <= EPSILON) return [];
	const t = (p0 - p1) / denominator;
	return t > EPSILON && t < .9999999999 ? [t] : [];
}
/**
* Returns endpoints and extrema of a quadratic Bezier curve.
* @param {number} startX Start X coordinate.
* @param {number} startY Start Y coordinate.
* @param {number} controlX Control X coordinate.
* @param {number} controlY Control Y coordinate.
* @param {number} endX End X coordinate.
* @param {number} endY End Y coordinate.
* @returns {Array<{x: number, y: number}>} Points enclosing the drawn curve.
*/
function getQuadraticBoundsPoints(startX, startY, controlX, controlY, endX, endY) {
	return [.../* @__PURE__ */ new Set([
		0,
		1,
		...getQuadraticExtrema(startX, controlX, endX),
		...getQuadraticExtrema(startY, controlY, endY)
	])].map((t) => ({
		x: getQuadraticValue(startX, controlX, endX, t),
		y: getQuadraticValue(startY, controlY, endY, t)
	}));
}
function getCubicValue(p0, p1, p2, p3, t) {
	const inverse = 1 - t;
	return inverse * inverse * inverse * p0 + 3 * inverse * inverse * t * p1 + 3 * inverse * t * t * p2 + t * t * t * p3;
}
function getCubicExtrema(p0, p1, p2, p3) {
	const a = -p0 + 3 * p1 - 3 * p2 + p3;
	const b = 3 * p0 - 6 * p1 + 3 * p2;
	const c = -3 * p0 + 3 * p1;
	if (Math.abs(a) <= EPSILON) {
		if (Math.abs(b) <= EPSILON) return [];
		const t = -c / (2 * b);
		return t > EPSILON && t < .9999999999 ? [t] : [];
	}
	const derivativeA = 3 * a;
	const derivativeB = 2 * b;
	const discriminant = derivativeB * derivativeB - 4 * derivativeA * c;
	if (discriminant < -1e-10) return [];
	if (Math.abs(discriminant) <= EPSILON) {
		const t = -derivativeB / (2 * derivativeA);
		return t > EPSILON && t < .9999999999 ? [t] : [];
	}
	const sqrt = Math.sqrt(discriminant);
	return [(-derivativeB + sqrt) / (2 * derivativeA), (-derivativeB - sqrt) / (2 * derivativeA)].filter((t) => t > EPSILON && t < .9999999999);
}
/**
* Returns endpoints and extrema of a cubic Bezier curve.
* @param {number} startX Start X coordinate.
* @param {number} startY Start Y coordinate.
* @param {number} control1X First control X coordinate.
* @param {number} control1Y First control Y coordinate.
* @param {number} control2X Second control X coordinate.
* @param {number} control2Y Second control Y coordinate.
* @param {number} endX End X coordinate.
* @param {number} endY End Y coordinate.
* @returns {Array<{x: number, y: number}>} Points enclosing the drawn curve.
*/
function getCubicBoundsPoints(startX, startY, control1X, control1Y, control2X, control2Y, endX, endY) {
	return [.../* @__PURE__ */ new Set([
		0,
		1,
		...getCubicExtrema(startX, control1X, control2X, endX),
		...getCubicExtrema(startY, control1Y, control2Y, endY)
	])].map((t) => ({
		x: getCubicValue(startX, control1X, control2X, endX, t),
		y: getCubicValue(startY, control1Y, control2Y, endY, t)
	}));
}
function normalizeVector(x, y) {
	const length = Math.hypot(x, y);
	return length <= EPSILON ? null : {
		x: x / length,
		y: y / length
	};
}
function dot(a, b) {
	return a.x * b.x + a.y * b.y;
}
function getArcToSegment(start, corner, end, radius) {
	if (radius <= 0) return null;
	const toStart = normalizeVector(start.x - corner.x, start.y - corner.y);
	const toEnd = normalizeVector(end.x - corner.x, end.y - corner.y);
	if (!toStart || !toEnd) return null;
	const angle = Math.acos(Math.min(Math.max(dot(toStart, toEnd), -1), 1));
	if (angle <= EPSILON || Math.abs(Math.PI - angle) <= EPSILON) return null;
	const tangentDistance = radius / Math.tan(angle / 2);
	if (!Number.isFinite(tangentDistance)) return null;
	const startTangent = {
		x: corner.x + toStart.x * tangentDistance,
		y: corner.y + toStart.y * tangentDistance
	};
	const endTangent = {
		x: corner.x + toEnd.x * tangentDistance,
		y: corner.y + toEnd.y * tangentDistance
	};
	const bisector = normalizeVector(toStart.x + toEnd.x, toStart.y + toEnd.y);
	if (!bisector) return null;
	const centerDistance = radius / Math.sin(angle / 2);
	const center = {
		x: corner.x + bisector.x * centerDistance,
		y: corner.y + bisector.y * centerDistance
	};
	const startRadius = {
		x: startTangent.x - center.x,
		y: startTangent.y - center.y
	};
	const inputDirection = normalizeVector(corner.x - start.x, corner.y - start.y);
	if (!inputDirection) return null;
	const counterClockwiseTangent = {
		x: -startRadius.y,
		y: startRadius.x
	};
	return {
		center,
		counterClockwise: dot({
			x: startRadius.y,
			y: -startRadius.x
		}, inputDirection) > dot(counterClockwiseTangent, inputDirection),
		endAngle: Math.atan2(endTangent.y - center.y, endTangent.x - center.x),
		endTangent,
		startAngle: Math.atan2(startTangent.y - center.y, startTangent.x - center.x),
		startTangent
	};
}
/**
* Calculates tangent-arc bounds and the resulting current point.
* @param {{x: number, y: number}} start Current path position.
* @param {{x: number, y: number}} corner Intersection of the tangent lines.
* @param {{x: number, y: number}} end Point on the outgoing tangent.
* @param {number} radius Arc radius.
* @returns {{currentPoint: {x: number, y: number}, points: Array<{x: number, y: number}>}} The endpoint and points enclosing the arc.
*/
function getArcToBounds(start, corner, end, radius) {
	const segment = getArcToSegment(start, corner, end, radius);
	if (!segment) return {
		currentPoint: corner,
		points: [start, corner]
	};
	return {
		currentPoint: segment.endTangent,
		points: [
			start,
			segment.startTangent,
			segment.endTangent,
			...getArcBoundsPoints(segment.center.x, segment.center.y, radius, segment.startAngle, segment.endAngle, segment.counterClockwise)
		]
	};
}

// src/render.js
/**
* @typedef {object} Bounds
* @property {number} top The minimum Y coordinate.
* @property {number} right The maximum X coordinate.
* @property {number} bottom The maximum Y coordinate.
* @property {number} left The minimum X coordinate.
* @property {number} x The minimum X coordinate.
* @property {number} y The minimum Y coordinate.
* @property {number} width The horizontal extent.
* @property {number} height The vertical extent.
*/
/**
* @typedef {object} RenderOptions
* @property {string|CanvasGradient|CanvasPattern|null} [fillStyle] The fill, or no fill.
* @property {string|CanvasGradient|CanvasPattern|null} [strokeStyle] The stroke, or no stroke.
* @property {number} [lineWidth] The stroke width in canvas units.
* @property {number} [shadowBlur=0] The shadow blur amount.
* @property {string|null} [shadowColor] The shadow color, or no shadow.
* @property {number} [shadowOffsetX=0] The horizontal shadow offset.
* @property {number} [shadowOffsetY=0] The vertical shadow offset.
*/
/**
* Creates an empty axis-aligned bounding box.
* @returns {Bounds} A zero-sized box at the origin.
*/
function emptyBounds() {
	return {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
}
/**
* Applies shared fill, stroke, and shadow options to a context.
* @param {CanvasRenderingContext2D} context The drawing context.
* @param {RenderOptions} [options={}] The rendering styles.
*/
function applyStyles(context, options = {}) {
	if (options.fillStyle != null) context.fillStyle = options.fillStyle;
	if (options.strokeStyle != null) context.strokeStyle = options.strokeStyle;
	context.lineWidth = options.lineWidth ?? 1;
	context.shadowBlur = options.shadowBlur ?? 0;
	context.shadowColor = options.shadowColor ?? "transparent";
	context.shadowOffsetX = options.shadowOffsetX ?? 0;
	context.shadowOffsetY = options.shadowOffsetY ?? 0;
}
/**
* Rounds bounds outward and adds space for strokes and shadows.
* @param {Bounds} bounds The unpadded geometry bounds.
* @param {RenderOptions} [options={}] The rendering styles.
* @returns {{x: number, y: number, width: number, height: number}} The integer canvas origin and dimensions.
*/
function getRenderBounds(bounds, options = {}) {
	const stroke = options.strokeStyle ? Math.max(options.lineWidth ?? 0, 0) : 0;
	const hasShadow = Boolean(options.shadowColor);
	const shadowBlur = hasShadow ? Math.max(options.shadowBlur ?? 0, 0) : 0;
	const shadowOffsetX = hasShadow ? options.shadowOffsetX ?? 0 : 0;
	const shadowOffsetY = hasShadow ? options.shadowOffsetY ?? 0 : 0;
	let left = bounds.x - stroke;
	let top = bounds.y - stroke;
	let right = bounds.x + bounds.width + stroke;
	let bottom = bounds.y + bounds.height + stroke;
	if (shadowBlur || shadowOffsetX || shadowOffsetY) {
		left = Math.min(left, left + shadowOffsetX - shadowBlur);
		top = Math.min(top, top + shadowOffsetY - shadowBlur);
		right = Math.max(right, right + shadowOffsetX + shadowBlur);
		bottom = Math.max(bottom, bottom + shadowOffsetY + shadowBlur);
	}
	const x = Math.floor(left);
	const y = Math.floor(top);
	return {
		x,
		y,
		width: Math.max(Math.ceil(right) - x, 0),
		height: Math.max(Math.ceil(bottom) - y, 0)
	};
}

// src/path.js
/** @import { Bounds, RenderOptions } from './render.js'; */
/**
* Path
*/
var Path = class {
	#bounding;
	#context;
	#currentX;
	#currentY;
	#hasVertex;
	#path;
	#subpathStartX;
	#subpathStartY;
	/**
	* New Path constructor.
	* @param {CanvasRenderingContext2D} context The canvas context.
	*/
	constructor(context) {
		if (!context || typeof context.isPointInPath !== "function") throw new TypeError("Path requires a 2D canvas context.");
		if (typeof Path2D !== "function") throw new TypeError("Path requires Path2D support.");
		this.#context = context;
		this.#path = new Path2D();
		this.#hasVertex = false;
		this.#currentX = null;
		this.#currentY = null;
		this.#subpathStartX = null;
		this.#subpathStartY = null;
		this.#bounding = {
			top: Number.POSITIVE_INFINITY,
			right: Number.NEGATIVE_INFINITY,
			bottom: Number.NEGATIVE_INFINITY,
			left: Number.POSITIVE_INFINITY
		};
	}
	/**
	* Add an arc.
	* @param {number} x The X position of the arc center.
	* @param {number} y The Y position of the arc center.
	* @param {number} radius The arc radius.
	* @param {number} startAngle The arc start angle.
	* @param {number} endAngle The arc end angle.
	* @returns {Path} The Path.
	*/
	arc(x, y, radius, startAngle, endAngle) {
		const startsSubpath = !this.#hasVertex;
		this.#path.arc(x, y, radius, startAngle, endAngle);
		this.#setBoundsFromPoints(getArcBoundsPoints(x, y, radius, startAngle, endAngle));
		if (startsSubpath) {
			this.#subpathStartX = x + Math.cos(startAngle) * radius;
			this.#subpathStartY = y + Math.sin(startAngle) * radius;
		}
		this.#setCurrentPoint(x + Math.cos(endAngle) * radius, y + Math.sin(endAngle) * radius);
		return this;
	}
	/**
	* Add a bezier curve.
	* @param {number} x1 The start X position.
	* @param {number} y1 The start Y position.
	* @param {number} cx1 The first control point X position.
	* @param {number} cy1 The first control point Y position.
	* @param {number} cx2 The second control point X position.
	* @param {number} cy2 The second control point Y position.
	* @param {number} x2 The end X position.
	* @param {number} y2 The end Y position.
	* @returns {Path} The Path.
	*/
	bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
		this.#moveTo(x1, y1);
		this.#path.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
		this.#setBoundsFromPoints(getCubicBoundsPoints(x1, y1, cx1, cy1, cx2, cy2, x2, y2));
		this.#setCurrentPoint(x2, y2, false);
		return this;
	}
	/**
	* Add a bezier vertex.
	* @param {number} cx1 The first control point X position.
	* @param {number} cy1 The first control point Y position.
	* @param {number} cx2 The second control point X position.
	* @param {number} cy2 The second control point Y position.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {Path} The Path.
	*/
	bezierVertex(cx1, cy1, cx2, cy2, x, y) {
		const startX = this.#currentX ?? cx1;
		const startY = this.#currentY ?? cy1;
		this.#path.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
		this.#setBoundsFromPoints(this.#hasVertex ? getCubicBoundsPoints(startX, startY, cx1, cy1, cx2, cy2, x, y) : [
			{
				x: cx1,
				y: cy1
			},
			{
				x: cx2,
				y: cy2
			},
			{
				x,
				y
			}
		]);
		this.#setCurrentPoint(x, y);
		return this;
	}
	/**
	* Add a circle.
	* @param {number} x The X position of the circle center.
	* @param {number} y The Y position of the circle center.
	* @param {number} radius The circle radius.
	* @returns {Path} The Path.
	*/
	circle(x, y, radius) {
		return this.ellipse(x, y, radius * 2, radius * 2);
	}
	/**
	* Close the path.
	* @returns {Path} The Path.
	*/
	close() {
		this.#path.closePath();
		if (this.#subpathStartX !== null && this.#subpathStartY !== null) {
			this.#currentX = this.#subpathStartX;
			this.#currentY = this.#subpathStartY;
			this.#hasVertex = true;
		}
		return this;
	}
	/**
	* Determine if the path contains a point.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {boolean} TRUE if the path contains the point, otherwise FALSE.
	*/
	containsPoint(x, y) {
		return this.#context.isPointInPath(this.#path, x, y);
	}
	/**
	* Add a curve.
	* @param {number} x1 The start X position.
	* @param {number} y1 The start Y position.
	* @param {number} cx1 The first control point X position.
	* @param {number} cy1 The first control point Y position.
	* @param {number} cx2 The second control point X position.
	* @param {number} cy2 The second control point Y position.
	* @param {number} radius The arc radius.
	* @returns {Path} The Path.
	*/
	curve(x1, y1, cx1, cy1, cx2, cy2, radius) {
		this.#moveTo(x1, y1);
		this.#path.arcTo(cx1, cy1, cx2, cy2, radius);
		const { currentPoint, points } = getArcToBounds({
			x: x1,
			y: y1
		}, {
			x: cx1,
			y: cy1
		}, {
			x: cx2,
			y: cy2
		}, radius);
		this.#setBoundsFromPoints(points);
		this.#setCurrentPoint(currentPoint.x, currentPoint.y, false);
		return this;
	}
	/**
	* Add a curve vertex.
	* @param {number} cx1 The first control point X position.
	* @param {number} cy1 The first control point Y position.
	* @param {number} cx2 The second control point X position.
	* @param {number} cy2 The second control point Y position.
	* @param {number} radius The arc radius.
	* @returns {Path} The Path.
	*/
	curveVertex(cx1, cy1, cx2, cy2, radius) {
		const start = this.#hasVertex ? {
			x: this.#currentX,
			y: this.#currentY
		} : {
			x: cx1,
			y: cy1
		};
		this.#path.arcTo(cx1, cy1, cx2, cy2, radius);
		const { currentPoint, points } = getArcToBounds(start, {
			x: cx1,
			y: cy1
		}, {
			x: cx2,
			y: cy2
		}, radius);
		this.#setBoundsFromPoints(points);
		this.#setCurrentPoint(currentPoint.x, currentPoint.y);
		return this;
	}
	/**
	* Add an ellipse.
	* @param {number} x The X position of the ellipse center.
	* @param {number} y The Y position of the ellipse center.
	* @param {number} width The ellipse width.
	* @param {number} height The ellipse height.
	* @param {number} [angle=0] The ellipse angle.
	* @returns {Path} The Path.
	*/
	ellipse(x, y, width, height, angle = 0) {
		const xRadius = width / 2;
		const yRadius = height / 2;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		const xExtent = Math.hypot(xRadius * cos, yRadius * sin);
		const yExtent = Math.hypot(xRadius * sin, yRadius * cos);
		this.#path.ellipse(x, y, xRadius, yRadius, angle, 0, Math.PI * 2);
		this.#setBounds([x - xExtent, x + xExtent], [y - yExtent, y + yExtent]);
		this.#setCurrentPoint(x + xRadius * cos, y + xRadius * sin);
		return this;
	}
	/**
	* Get the bounding box of the path.
	* @returns {Bounds} The bounding box.
	*/
	getBoundingBox() {
		if (!Number.isFinite(this.#bounding.top) || !Number.isFinite(this.#bounding.right) || !Number.isFinite(this.#bounding.bottom) || !Number.isFinite(this.#bounding.left)) return emptyBounds();
		return {
			top: this.#bounding.top,
			right: this.#bounding.right,
			bottom: this.#bounding.bottom,
			left: this.#bounding.left,
			x: this.#bounding.left,
			y: this.#bounding.top,
			width: this.#bounding.right - this.#bounding.left,
			height: this.#bounding.bottom - this.#bounding.top
		};
	}
	/**
	* Add a line.
	* @param {number} x1 The start X position.
	* @param {number} y1 The start Y position.
	* @param {number} x2 The end X position.
	* @param {number} y2 The end Y position.
	* @returns {Path} The Path.
	*/
	line(x1, y1, x2, y2) {
		this.#moveTo(x1, y1);
		this.#path.lineTo(x2, y2);
		this.#setBounds([x1, x2], [y1, y2]);
		this.#setCurrentPoint(x2, y2, false);
		return this;
	}
	/**
	* Add a quadrilateral.
	* @param {number} x1 The first point X position.
	* @param {number} y1 The first point Y position.
	* @param {number} x2 The second point X position.
	* @param {number} y2 The second point Y position.
	* @param {number} x3 The third point X position.
	* @param {number} y3 The third point Y position.
	* @param {number} x4 The fourth point X position.
	* @param {number} y4 The fourth point Y position.
	* @returns {Path} The Path.
	*/
	quad(x1, y1, x2, y2, x3, y3, x4, y4) {
		this.#moveTo(x1, y1);
		this.#path.lineTo(x2, y2);
		this.#path.lineTo(x3, y3);
		this.#path.lineTo(x4, y4);
		this.#path.closePath();
		this.#setBounds([
			x1,
			x2,
			x3,
			x4
		], [
			y1,
			y2,
			y3,
			y4
		]);
		this.#currentX = x1;
		this.#currentY = y1;
		return this;
	}
	/**
	* Add a quadratic vertex.
	* @param {number} cx The control point X position.
	* @param {number} cy The control point Y position.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {Path} The Path.
	*/
	quadraticVertex(cx, cy, x, y) {
		const startX = this.#currentX ?? cx;
		const startY = this.#currentY ?? cy;
		this.#path.quadraticCurveTo(cx, cy, x, y);
		this.#setBoundsFromPoints(this.#hasVertex ? getQuadraticBoundsPoints(startX, startY, cx, cy, x, y) : [{
			x: cx,
			y: cy
		}, {
			x,
			y
		}]);
		this.#setCurrentPoint(x, y);
		return this;
	}
	/**
	* Add a rectangle.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @param {number} width The rectangle width.
	* @param {number} height The rectangle height.
	* @returns {Path} The Path.
	*/
	rect(x, y, width, height) {
		this.#path.rect(x, y, width, height);
		this.#setBounds([x, x + width], [y, y + height]);
		this.#setCurrentPoint(x, y, true);
		return this;
	}
	/**
	* Render the path.
	* @param {RenderOptions} [options={}] The rendering options.
	* @returns {HTMLCanvasElement} The rendered canvas.
	*/
	render(options = {}) {
		const bounds = this.getBoundingBox();
		const renderBounds = getRenderBounds(bounds, options);
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Unable to create a 2D canvas context.");
		canvas.setAttribute("width", renderBounds.width);
		canvas.setAttribute("height", renderBounds.height);
		applyStyles(context, options);
		context.translate(-renderBounds.x, -renderBounds.y);
		if (options.fillStyle) context.fill(this.#path);
		if (options.strokeStyle) context.stroke(this.#path);
		return canvas;
	}
	/**
	* Add a square.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @param {number} size The square size.
	* @returns {Path} The Path.
	*/
	square(x, y, size) {
		return this.rect(x, y, size, size);
	}
	/**
	* Add a triangle.
	* @param {number} x1 The first X position.
	* @param {number} y1 The first Y position.
	* @param {number} x2 The second X position.
	* @param {number} y2 The second Y position.
	* @param {number} x3 The third X position.
	* @param {number} y3 The third Y position.
	* @returns {Path} The Path.
	*/
	triangle(x1, y1, x2, y2, x3, y3) {
		this.#moveTo(x1, y1);
		this.#path.lineTo(x2, y2);
		this.#path.lineTo(x3, y3);
		this.#path.closePath();
		this.#setBounds([
			x1,
			x2,
			x3
		], [
			y1,
			y2,
			y3
		]);
		this.#currentX = x1;
		this.#currentY = y1;
		return this;
	}
	/**
	* Add a vertex.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {Path} The Path.
	*/
	vertex(x, y) {
		if (!this.#hasVertex) this.#moveTo(x, y);
		else {
			this.#path.lineTo(x, y);
			this.#setCurrentPoint(x, y, false);
		}
		this.#setBounds([x], [y]);
		return this;
	}
	/**
	* Move to a new subpath start.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	*/
	#moveTo(x, y) {
		this.#path.moveTo(x, y);
		this.#setCurrentPoint(x, y, true);
	}
	/**
	* Set the path bounds.
	* @param {number[]} xs The X co-ordinates.
	* @param {number[]} ys The Y co-ordinates.
	*/
	#setBounds(xs, ys) {
		this.#bounding.top = Math.min(this.#bounding.top, ...ys);
		this.#bounding.right = Math.max(this.#bounding.right, ...xs);
		this.#bounding.bottom = Math.max(this.#bounding.bottom, ...ys);
		this.#bounding.left = Math.min(this.#bounding.left, ...xs);
	}
	/**
	* Set the path bounds from points.
	* @param {{x: number, y: number}[]} points The points to include.
	*/
	#setBoundsFromPoints(points) {
		this.#setBounds(points.map((point) => point.x), points.map((point) => point.y));
	}
	/**
	* Set the current point.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @param {boolean} [resetSubpath=false] Whether to reset the subpath start.
	*/
	#setCurrentPoint(x, y, resetSubpath = false) {
		this.#currentX = x;
		this.#currentY = y;
		this.#hasVertex = true;
		if (resetSubpath || this.#subpathStartX === null || this.#subpathStartY === null) {
			this.#subpathStartX = x;
			this.#subpathStartY = y;
		}
	}
};

// src/vector.js
/**
* Vector
*/
var Vector = class Vector {
	/**
	* Create a new Vector.
	* @param {number} [x=0] The X position.
	* @param {number} [y=0] The Y position.
	* @returns {Vector} A new Vector object.
	*/
	static create(x = 0, y = 0) {
		return new this(x, y);
	}
	/**
	* Parse a Vector or X/Y co-ordinates.
	* @param {Vector|number} x A Vector, or the X position.
	* @param {number} [y] The Y position.
	* @returns {Vector} The parsed Vector.
	*/
	static parse(x = 0, y = 0) {
		if (x instanceof Vector) return x;
		return new this(x, y);
	}
	/**
	* Create a random Vector.
	* @returns {Vector} A new Vector object.
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
	}
	/**
	* Add another Vector to the Vector.
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
	* Calculate the angle to another Vector.
	* @param {Vector|number} x The other Vector, or the X position.
	* @param {number} [y] The Y position.
	* @returns {number} The angle to the other Vector.
	*/
	angleTo(x, y) {
		return this.constructor.parse(x, y).getHeading() - this.getHeading();
	}
	/**
	* Clone the Vector.
	* @returns {Vector} A new Vector.
	*/
	clone() {
		const VectorClass = this.constructor;
		return new VectorClass(this.x, this.y);
	}
	/**
	* Calculate the distance to another Vector.
	* @param {Vector|number} x The other Vector, or the X position.
	* @param {number} [y] The Y position.
	* @returns {number} The distance to the other Vector.
	*/
	distTo(x, y) {
		const other = this.constructor.parse(x, y);
		return Math.hypot(other.x - this.x, other.y - this.y);
	}
	/**
	* Divide the Vector by another.
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
	* Calculate the dot product of the Vector with another.
	* @param {Vector|number} x The other Vector, or the X position.
	* @param {number} [y] The Y position.
	* @returns {number} The dot product.
	*/
	dot(x, y) {
		const other = this.constructor.parse(x, y);
		return this.x * other.x + this.y * other.y;
	}
	/**
	* Get the angle of the Vector.
	* @returns {number} The angle.
	*/
	getHeading() {
		return Math.atan2(this.y, this.x);
	}
	/**
	* Get the magnitude of the Vector.
	* @returns {number} The magnitude.
	*/
	getMag() {
		return Math.hypot(this.x, this.y);
	}
	/**
	* Limit the Vector magnitude.
	* @param {number} mag The magnitude.
	* @returns {Vector} The Vector.
	*/
	limit(mag) {
		if (this.getMag() <= mag) return this;
		return this.setMag(mag);
	}
	/**
	* Multiply the Vector by another.
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
	* Normalize the Vector magnitude.
	* @returns {Vector} The Vector.
	*/
	normalize() {
		return this.setMag(1);
	}
	/**
	* Rotate the Vector.
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
	* Set the angle of the Vector.
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
	* Set the magnitude of the Vector.
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
	* Subtract another Vector from the Vector.
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
};

// src/shape.js
/** @import { Bounds, RenderOptions } from './render.js'; */
/**
* Shape
*/
var Shape = class {
	#context;
	#layers;
	/**
	* New Shape constructor.
	* @param {CanvasRenderingContext2D} context The canvas context.
	* @param {number} [x=0] The global X position.
	* @param {number} [y=0] The global Y position.
	* @param {number} [angle=0] The rotation angle.
	* @param {number} [anchorX=0] The anchor X position.
	* @param {number} [anchorY=0] The anchor Y position.
	*/
	constructor(context, x = 0, y = 0, angle = 0, anchorX = 0, anchorY = 0) {
		this.#context = context;
		this.x = x;
		this.y = y;
		this.angle = angle;
		this.anchorX = anchorX;
		this.anchorY = anchorY;
		this.#layers = [];
	}
	/**
	* Determine if the shape contains a point.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {boolean} TRUE if the shape contains the point, otherwise FALSE.
	*/
	containsPoint(x, y) {
		const anchor = Vector.create(this.x + this.anchorX, this.y + this.anchorY);
		const rotatedPoint = Vector.create(x, y).sub(anchor).rotate(-this.angle).add(anchor);
		let pointInShape = false;
		for (const { contour, path } of this.#layers) {
			if (pointInShape && !contour || !pointInShape && contour || !path.containsPoint(rotatedPoint.x - this.x, rotatedPoint.y - this.y)) continue;
			pointInShape = !pointInShape;
		}
		return pointInShape;
	}
	/**
	* Add a contour to the shape.
	* @param {(path: Path) => void} callback The callback to generate the path.
	* @returns {Shape} The Shape.
	*/
	contour(callback) {
		return this.layer(callback, true);
	}
	/**
	* Get the bounding box of the shape.
	* @returns {Bounds} The bounding box.
	*/
	getBoundingBox() {
		const bounding = {
			top: Number.POSITIVE_INFINITY,
			right: Number.NEGATIVE_INFINITY,
			bottom: Number.NEGATIVE_INFINITY,
			left: Number.POSITIVE_INFINITY
		};
		for (const layer of this.#layers) {
			if (layer.contour) continue;
			const bounds = layer.path.getBoundingBox();
			const rotated1 = this.#rotatePoint(bounds.right, bounds.top);
			const rotated2 = this.#rotatePoint(bounds.right, bounds.bottom);
			const rotated3 = this.#rotatePoint(bounds.left, bounds.bottom);
			const rotated4 = this.#rotatePoint(bounds.left, bounds.top);
			bounding.top = Math.min(bounding.top, rotated1.y, rotated2.y, rotated3.y, rotated4.y);
			bounding.right = Math.max(bounding.right, rotated1.x, rotated2.x, rotated3.x, rotated4.x);
			bounding.bottom = Math.max(bounding.bottom, rotated1.y, rotated2.y, rotated3.y, rotated4.y);
			bounding.left = Math.min(bounding.left, rotated1.x, rotated2.x, rotated3.x, rotated4.x);
		}
		if (!Number.isFinite(bounding.top) || !Number.isFinite(bounding.right) || !Number.isFinite(bounding.bottom) || !Number.isFinite(bounding.left)) return emptyBounds();
		return {
			top: bounding.top + this.y,
			right: bounding.right + this.x,
			bottom: bounding.bottom + this.y,
			left: bounding.left + this.x,
			x: bounding.left + this.x,
			y: bounding.top + this.y,
			width: bounding.right - bounding.left,
			height: bounding.bottom - bounding.top
		};
	}
	/**
	* Add a layer to the shape.
	* @param {(path: Path) => void} callback The callback to generate the path.
	* @param {boolean} [contour=false] Whether the path is contoured.
	* @returns {Shape} The Shape.
	*/
	layer(callback, contour = false) {
		const path = new Path(this.#context);
		callback(path);
		this.#layers.push({
			contour,
			path
		});
		return this;
	}
	/**
	* Render the shape.
	* @param {RenderOptions} [options={}] The rendering options.
	* @returns {HTMLCanvasElement} The rendered canvas.
	*/
	render(options = {}) {
		const canvas = document.createElement("canvas");
		if (!this.#layers.length) {
			canvas.setAttribute("width", 0);
			canvas.setAttribute("height", 0);
			return canvas;
		}
		const renderBounds = getRenderBounds(this.getBoundingBox(), options);
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Unable to create a 2D canvas context.");
		canvas.setAttribute("width", renderBounds.width);
		canvas.setAttribute("height", renderBounds.height);
		context.translate(this.x - renderBounds.x, this.y - renderBounds.y);
		context.translate(this.anchorX, this.anchorY);
		context.rotate(this.angle);
		context.translate(-this.anchorX, -this.anchorY);
		for (const { contour, path } of this.#layers) {
			let layerOptions;
			if (contour) {
				context.globalCompositeOperation = "destination-out";
				layerOptions = {
					...options,
					fillStyle: "#000"
				};
			} else {
				context.globalCompositeOperation = "source-over";
				layerOptions = options;
			}
			const layerBounds = getRenderBounds(path.getBoundingBox(), layerOptions);
			const layerCanvas = path.render(layerOptions);
			context.drawImage(layerCanvas, layerBounds.x, layerBounds.y);
		}
		return canvas;
	}
	/**
	* Rotate a point around the anchor.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {Vector} The rotated Vector.
	*/
	#rotatePoint(x, y) {
		const translatedX = x - this.anchorX;
		const translatedY = y - this.anchorY;
		const cos = Math.cos(this.angle);
		const sin = Math.sin(this.angle);
		return Vector.create(translatedX * cos - translatedY * sin + this.anchorX, translatedX * sin + translatedY * cos + this.anchorY);
	}
};

// src/canvas-context.js
/** @import { RenderOptions } from './render.js'; */
/**
* @typedef {object} TextOptions
* @property {string} [font='sans-serif'] The font family.
* @property {number} [fontSize=10] The font size in pixels.
* @property {string|number|null} [fontWeight=null] The font weight.
* @property {CanvasTextAlign} [textAlign='start'] The horizontal text alignment.
* @property {CanvasTextBaseline} [textBaseline='alphabetic'] The vertical text alignment.
*/
/** @typedef {RenderOptions & TextOptions} CanvasContextOptions */
/**
* CanvasContext
*/
var CanvasContext = class {
	#context;
	#hasVertex;
	#node;
	#options;
	#states;
	/**
	* New CanvasContext constructor.
	* @param {HTMLCanvasElement} node The canvas node.
	* @param {number} [width=600] The canvas width.
	* @param {number} [height=400] The canvas height.
	* @param {CanvasContextOptions} [options={}] The canvas options.
	*/
	constructor(node, width = 600, height = 400, options = {}) {
		this.#node = node;
		this.#context = node?.getContext?.("2d");
		if (!this.#context) throw new TypeError("CanvasContext requires a 2D canvas context.");
		this.#options = {
			...this.constructor.defaults,
			...options
		};
		this.#states = [];
		this.#hasVertex = false;
		this.resize(width, height);
	}
	/**
	* Apply a matrix transform.
	* @param {number} a The horizontal scaling amount.
	* @param {number} b The vertical skewing.
	* @param {number} c The horizontal skewing.
	* @param {number} d The vertical scaling amount.
	* @param {number} e The horizontal translation.
	* @param {number} f The vertical translation.
	* @returns {CanvasContext} The CanvasContext.
	*/
	applyMatrix(a, b, c, d, e, f) {
		this.#context.transform(a, b, c, d, e, f);
		return this;
	}
	/**
	* Draw an arc.
	* @param {number} x The X position of the arc center.
	* @param {number} y The Y position of the arc center.
	* @param {number} radius The arc radius.
	* @param {number} startAngle The arc start angle.
	* @param {number} endAngle The arc end angle.
	* @returns {CanvasContext} The CanvasContext.
	*/
	arc(x, y, radius, startAngle, endAngle) {
		this.begin();
		this.#context.arc(x, y, radius, startAngle, endAngle);
		return this.end();
	}
	/**
	* Fill the entire canvas with a color.
	* @param {string|CanvasGradient} color The color/gradient.
	* @returns {CanvasContext} The CanvasContext.
	*/
	background(color) {
		return this.push().resetMatrix().noStroke().fill(color).rect(0, 0, this.width, this.height).pop();
	}
	/**
	* Begin a path.
	* @returns {CanvasContext} The CanvasContext.
	*/
	begin() {
		this.#context.beginPath();
		this.#hasVertex = false;
		return this;
	}
	/**
	* Draw a bezier curve.
	* @param {number} x1 The start X position.
	* @param {number} y1 The start Y position.
	* @param {number} cx1 The first control point X position.
	* @param {number} cy1 The first control point Y position.
	* @param {number} cx2 The second control point X position.
	* @param {number} cy2 The second control point Y position.
	* @param {number} x2 The end X position.
	* @param {number} y2 The end Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
		return this.begin().vertex(x1, y1).bezierVertex(cx1, cy1, cx2, cy2, x2, y2).end();
	}
	/**
	* Add a bezier vertex.
	* @param {number} cx1 The first control point X position.
	* @param {number} cy1 The first control point Y position.
	* @param {number} cx2 The second control point X position.
	* @param {number} cy2 The second control point Y position.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	bezierVertex(cx1, cy1, cx2, cy2, x, y) {
		this.#context.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
		return this;
	}
	/**
	* Draw a circle.
	* @param {number} x The X position of the circle center.
	* @param {number} y The Y position of the circle center.
	* @param {number} radius The circle radius.
	* @returns {CanvasContext} The CanvasContext.
	*/
	circle(x, y, radius) {
		return this.ellipse(x, y, radius * 2, radius * 2);
	}
	/**
	* Clear the entire canvas.
	* @returns {CanvasContext} The CanvasContext.
	*/
	clear() {
		this.push();
		this.resetMatrix();
		this.#context.clearRect(0, 0, this.width, this.height);
		return this.pop();
	}
	/**
	* Create a new Path.
	* @returns {Path} The Path.
	*/
	createPath() {
		return new Path(this.#context);
	}
	/**
	* Create a new Shape.
	* @param {number} [x=0] The global X position.
	* @param {number} [y=0] The global Y position.
	* @param {number} [angle=0] The rotation angle.
	* @param {number} [anchorX=0] The anchor X position.
	* @param {number} [anchorY=0] The anchor Y position.
	* @returns {Shape} The Shape.
	*/
	createShape(x = 0, y = 0, angle = 0, anchorX = 0, anchorY = 0) {
		return new Shape(this.#context, x, y, angle, anchorX, anchorY);
	}
	/**
	* Draw a curve.
	* @param {number} x1 The start X position.
	* @param {number} y1 The start Y position.
	* @param {number} cx1 The first control point X position.
	* @param {number} cy1 The first control point Y position.
	* @param {number} cx2 The second control point X position.
	* @param {number} cy2 The second control point Y position.
	* @param {number} radius The arc radius.
	* @returns {CanvasContext} The CanvasContext.
	*/
	curve(x1, y1, cx1, cy1, cx2, cy2, radius) {
		return this.begin().vertex(x1, y1).curveVertex(cx1, cy1, cx2, cy2, radius).end();
	}
	/**
	* Add a curve vertex.
	* @param {number} cx1 The first control point X position.
	* @param {number} cy1 The first control point Y position.
	* @param {number} cx2 The second control point X position.
	* @param {number} cy2 The second control point Y position.
	* @param {number} radius The arc radius.
	* @returns {CanvasContext} The CanvasContext.
	*/
	curveVertex(cx1, cy1, cx2, cy2, radius) {
		this.#context.arcTo(cx1, cy1, cx2, cy2, radius);
		return this;
	}
	/**
	* Draw an image on the canvas.
	* @param {HTMLImageElement|SVGImageElement|HTMLVideoElement|HTMLCanvasElement|ImageBitmap|OffscreenCanvas|VideoFrame} image The image.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	drawImage(image, x = 0, y = 0) {
		this.#context.drawImage(image, x, y);
		return this;
	}
	/**
	* Draw a Path on the canvas.
	* @param {Path} path The Path.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	drawPath(path, x = 0, y = 0) {
		const bounds = getRenderBounds(path.getBoundingBox(), this.#options);
		const canvas = path.render(this.#options);
		return this.drawImage(canvas, bounds.x + x, bounds.y + y);
	}
	/**
	* Draw a Shape on the canvas.
	* @param {Shape} shape The Shape.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	drawShape(shape, x = 0, y = 0) {
		const bounds = getRenderBounds(shape.getBoundingBox(), this.#options);
		const canvas = shape.render(this.#options);
		return this.drawImage(canvas, bounds.x + x, bounds.y + y);
	}
	/**
	* Draw an ellipse.
	* @param {number} x The X position of the ellipse center.
	* @param {number} y The Y position of the ellipse center.
	* @param {number} width The ellipse width.
	* @param {number} height The ellipse height.
	* @param {number} [angle=0] The ellipse angle.
	* @returns {CanvasContext} The CanvasContext.
	*/
	ellipse(x, y, width, height, angle = 0) {
		this.begin();
		this.#context.ellipse(x, y, width / 2, height / 2, angle, 0, Math.PI * 2);
		return this.end();
	}
	/**
	* End and draw the path.
	* @param {boolean} [close=false] Whether to close the path.
	* @returns {CanvasContext} The CanvasContext.
	*/
	end(close = false) {
		if (close) this.#context.closePath();
		this.#draw();
		return this;
	}
	/**
	* Erase a path from the Canvas.
	* @param {(path: Path) => void} callback The callback to generate the path.
	* @returns {CanvasContext} The CanvasContext.
	*/
	erase(callback) {
		const path = this.createPath();
		callback(path);
		this.push();
		this.#context.globalCompositeOperation = "destination-out";
		this.noStroke();
		this.noShadow();
		this.fill("#000");
		this.#applyStyles();
		this.drawPath(path);
		return this.pop();
	}
	/**
	* Set the fill color/style.
	* @param {string|CanvasGradient} color The color/gradient.
	* @returns {CanvasContext} The CanvasContext.
	*/
	fill(color) {
		this.#options.fillStyle = color;
		return this;
	}
	/**
	* Set the font family.
	* @param {string} font The font family.
	* @returns {CanvasContext} The CanvasContext.
	*/
	font(font) {
		this.#options.font = font;
		return this;
	}
	/**
	* Set the font size.
	* @param {number} size The font size.
	* @returns {CanvasContext} The CanvasContext.
	*/
	fontSize(size) {
		this.#options.fontSize = size;
		return this;
	}
	/**
	* Set the font weight.
	* @param {string|number} weight The font weight.
	* @returns {CanvasContext} The CanvasContext.
	*/
	fontWeight(weight) {
		this.#options.fontWeight = weight;
		return this;
	}
	/**
	* Get the canvas image data.
	* @param {number} sx The X offset.
	* @param {number} sy The Y offset.
	* @param {number} sw The width.
	* @param {number} sh The height.
	* @returns {ImageData} The image data.
	*/
	getImage(sx, sy, sw, sh) {
		return this.#context.getImageData(sx, sy, sw, sh);
	}
	/**
	* Get the active canvas options.
	* @returns {CanvasContextOptions} A copy of the active options.
	*/
	getOptions() {
		return { ...this.#options };
	}
	/**
	* Draw a line.
	* @param {number} x1 The start X position.
	* @param {number} y1 The start Y position.
	* @param {number} x2 The end X position.
	* @param {number} y2 The end Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	line(x1, y1, x2, y2) {
		return this.begin().vertex(x1, y1).vertex(x2, y2).end();
	}
	/**
	* Create a linear gradient.
	* @param {number} x1 The starting X position.
	* @param {number} y1 The starting Y position.
	* @param {number} x2 The ending X position.
	* @param {number} y2 The ending Y position.
	* @returns {CanvasGradient} The CanvasGradient.
	*/
	linearGradient(x1, y1, x2, y2) {
		return this.#context.createLinearGradient(x1, y1, x2, y2);
	}
	/**
	* Remove the fill color/style.
	* @returns {CanvasContext} The CanvasContext.
	*/
	noFill() {
		this.#options.fillStyle = null;
		return this;
	}
	/**
	* Remove the shadow.
	* @returns {CanvasContext} The CanvasContext.
	*/
	noShadow() {
		this.#options.shadowColor = "rgba(0,0,0,0)";
		return this;
	}
	/**
	* Remove the stroke.
	* @returns {CanvasContext} The CanvasContext.
	*/
	noStroke() {
		this.#options.strokeStyle = null;
		return this;
	}
	/**
	* Draw a point.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	point(x, y) {
		const { lineWidth, strokeStyle } = this.#options;
		const radius = Math.max(lineWidth, 1) / 2;
		return this.push().noStroke().fill(strokeStyle).circle(x, y, radius).pop();
	}
	/**
	* Restore the previous canvas settings and transformation.
	* @returns {CanvasContext} The CanvasContext.
	*/
	pop() {
		if (this.#states.length) {
			this.#options = this.#states.pop();
			this.#context.restore();
		}
		return this;
	}
	/**
	* Save the canvas settings and transformation.
	* @returns {CanvasContext} The CanvasContext.
	*/
	push() {
		this.#states.push({ ...this.#options });
		this.#context.save();
		return this;
	}
	/**
	* Put image data on the canvas.
	* @param {ImageData} image The image data.
	* @param {number} dx The X position.
	* @param {number} dy The Y  position.
	* @param {number} dirtyX The X offset.
	* @param {number} dirtyY The Y offset.
	* @param {number} dirtyWidth The width.
	* @param {number} dirtyHeight The height.
	* @returns {CanvasContext} The CanvasContext.
	*/
	putImage(image, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
		if (arguments.length > 3) this.#context.putImageData(image, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
		else this.#context.putImageData(image, dx, dy);
		return this;
	}
	/**
	* Draw a quadrilateral.
	* @param {number} x1 The first point X position.
	* @param {number} y1 The first point Y position.
	* @param {number} x2 The second point X position.
	* @param {number} y2 The second point Y position.
	* @param {number} x3 The third point X position.
	* @param {number} y3 The third point Y position.
	* @param {number} x4 The fourth point X position.
	* @param {number} y4 The fourth point Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	quad(x1, y1, x2, y2, x3, y3, x4, y4) {
		return this.begin().vertex(x1, y1).vertex(x2, y2).vertex(x3, y3).vertex(x4, y4).end(true);
	}
	/**
	* Add a quadratic vertex.
	* @param {number} cx The control point X position.
	* @param {number} cy The control point Y position.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	quadraticVertex(cx, cy, x, y) {
		this.#context.quadraticCurveTo(cx, cy, x, y);
		return this;
	}
	/**
	* Create a radial gradient.
	* @param {number} x1 The starting X position.
	* @param {number} y1 The starting Y position.
	* @param {number} r1 The starting radius.
	* @param {number} x2 The ending X position.
	* @param {number} y2 The ending Y position.
	* @param {number} r2 The ending radius.
	* @returns {CanvasGradient} The CanvasGradient.
	*/
	radialGradient(x1, y1, r1, x2, y2, r2) {
		return this.#context.createRadialGradient(x1, y1, r1, x2, y2, r2);
	}
	/**
	* Draw a rectangle.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @param {number} width The rectangle width.
	* @param {number} height The rectangle height.
	* @returns {CanvasContext} The CanvasContext.
	*/
	rect(x, y, width, height) {
		this.begin();
		this.#context.rect(x, y, width, height);
		return this.end();
	}
	/**
	* Reset the canvas settings and transformation.
	* @returns {CanvasContext} The CanvasContext.
	*/
	reset() {
		this.#options = { ...this.constructor.defaults };
		return this.resetMatrix();
	}
	/**
	* Reset the canvas transformation matrix.
	* @returns {CanvasContext} The CanvasContext.
	*/
	resetMatrix() {
		this.#context.resetTransform();
		return this;
	}
	/**
	* Resize the canvas.
	* @param {number} w The width.
	* @param {number} h The height.
	* @returns {CanvasContext} The CanvasContext.
	*/
	resize(w, h) {
		if (![w, h].every((value) => Number.isFinite(value) && value >= 0)) throw new RangeError("Canvas dimensions must be finite, non-negative numbers.");
		this.width = w;
		this.height = h;
		this.#node.setAttribute("width", this.width);
		this.#node.setAttribute("height", this.height);
		this.#states = [];
		this.#hasVertex = false;
		this.#applyStyles();
		this.#context.textAlign = this.#options.textAlign;
		this.#context.textBaseline = this.#options.textBaseline;
		return this;
	}
	/**
	* Rotate the canvas.
	* @param {number} angle The rotation angle.
	* @returns {CanvasContext} The CanvasContext.
	*/
	rotate(angle) {
		this.#context.rotate(angle);
		return this;
	}
	/**
	* Scale the canvas.
	* @param {number} x The horizontal scaling.
	* @param {number} [y] The vertical scaling.
	* @returns {CanvasContext} The CanvasContext.
	*/
	scale(x, y = x) {
		this.#context.scale(x, y);
		return this;
	}
	/**
	* Set the shadow color.
	* @param {string|CanvasGradient} color The color.
	* @returns {CanvasContext} The CanvasContext.
	*/
	shadow(color) {
		this.#options.shadowColor = color;
		return this;
	}
	/**
	* Set the shadow blur amount.
	* @param {number} amount The blur amount.
	* @returns {CanvasContext} The CanvasContext.
	*/
	shadowBlur(amount) {
		this.#options.shadowBlur = amount;
		return this;
	}
	/**
	* Set the shadow x/y offset.
	* @param {number} [x=0] The X offset.
	* @param {number} [y=0] The Y offset.
	* @returns {CanvasContext} The CanvasContext.
	*/
	shadowOffset(x = 0, y = 0) {
		this.#options.shadowOffsetX = x;
		this.#options.shadowOffsetY = y;
		return this;
	}
	/**
	* Draw a square.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @param {number} size The square size.
	* @returns {CanvasContext} The CanvasContext.
	*/
	square(x, y, size) {
		return this.rect(x, y, size, size);
	}
	/**
	* Set the stroke color/style.
	* @param {string|CanvasGradient} color The color/gradient.
	* @returns {CanvasContext} The CanvasContext.
	*/
	stroke(color) {
		this.#options.strokeStyle = color;
		return this;
	}
	/**
	* Set the stroke width.
	* @param {number} width The width.
	* @returns {CanvasContext} The CanvasContext.
	*/
	strokeWidth(width) {
		this.#options.lineWidth = width;
		return this;
	}
	/**
	* Draw text to the canvas.
	* @param {string} text The text to draw.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	text(text, x, y) {
		this.#applyStyles();
		const font = [];
		if (this.#options.fontWeight) font.push(this.#options.fontWeight);
		font.push(`${this.#options.fontSize}px`);
		font.push(this.#options.font);
		this.#context.font = font.join(" ");
		this.#context.textAlign = this.#options.textAlign;
		this.#context.textBaseline = this.#options.textBaseline;
		if (this.#options.fillStyle) this.#context.fillText(text, x, y);
		if (this.#options.strokeStyle) this.#context.strokeText(text, x, y);
		return this;
	}
	/**
	* Set the text alignment.
	* @param {string} alignment The text alignment.
	* @returns {CanvasContext} The CanvasContext.
	*/
	textAlign(alignment) {
		this.#options.textAlign = alignment;
		return this;
	}
	/**
	* Set the text baseline.
	* @param {string} baseline The text baseline.
	* @returns {CanvasContext} The CanvasContext.
	*/
	textBaseline(baseline) {
		this.#options.textBaseline = baseline;
		return this;
	}
	/**
	* Translate the canvas origin.
	* @param {number} x The X offset.
	* @param {number} y The Y offset.
	* @returns {CanvasContext} The CanvasContext.
	*/
	translate(x, y) {
		this.#context.translate(x, y);
		return this;
	}
	/**
	* Draw a triangle.
	* @param {number} x1 The first X position.
	* @param {number} y1 The first Y position.
	* @param {number} x2 The second X position.
	* @param {number} y2 The second Y position.
	* @param {number} x3 The third X position.
	* @param {number} y3 The third Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	triangle(x1, y1, x2, y2, x3, y3) {
		return this.begin().vertex(x1, y1).vertex(x2, y2).vertex(x3, y3).end(true);
	}
	/**
	* Add a vertex.
	* @param {number} x The X position.
	* @param {number} y The Y position.
	* @returns {CanvasContext} The CanvasContext.
	*/
	vertex(x, y) {
		if (!this.#hasVertex) {
			this.#context.moveTo(x, y);
			this.#hasVertex = true;
		} else this.#context.lineTo(x, y);
		return this;
	}
	/**
	* Update the canvas context.
	*/
	#applyStyles() {
		applyStyles(this.#context, this.#options);
	}
	/**
	* Draw to the canvas.
	*/
	#draw() {
		this.#applyStyles();
		if (this.#options.fillStyle) this.#context.fill();
		if (this.#options.strokeStyle) this.#context.stroke();
	}
};
/** @type {Readonly<CanvasContextOptions>} */
CanvasContext.defaults = Object.freeze({
	fillStyle: null,
	font: "sans-serif",
	fontSize: 10,
	fontWeight: null,
	lineWidth: 1,
	shadowBlur: 0,
	shadowColor: null,
	shadowOffsetX: 0,
	shadowOffsetY: 0,
	strokeStyle: "#000",
	textAlign: "start",
	textBaseline: "alphabetic"
});

// src/canvas.js
/**
* @typedef {object} CanvasRuntime
* @property {Window|EventTarget} [eventTarget] Target for global input and default animation scheduling.
* @property {function(): number} [now] Monotonic clock returning milliseconds.
* @property {function(FrameRequestCallback): number} [requestAnimationFrame] Schedules a frame.
* @property {function(number): void} [cancelAnimationFrame] Cancels a scheduled frame.
*/
/**
* @typedef {object} CanvasOptions
* @property {CanvasRuntime} [runtime] Overrides for timing, frame scheduling, and input events.
*/
/**
* Canvas
*/
var Canvas = class {
	#cancelAnimationFrame;
	#destroyed;
	#eventTarget;
	#frameId;
	#keysDown;
	#listeners;
	#loop;
	#mouseDown;
	#mouseX;
	#mouseY;
	#node;
	#now;
	#previousTime;
	#requestAnimationFrame;
	#startTime;
	/**
	* Create a new Canvas with a new canvas element.
	* @param {HTMLElement} [parent] The parent node.
	* @param {number} [width=600] The canvas width.
	* @param {number} [height=400] The canvas height.
	* @param {CanvasOptions} [options={}] Additional canvas options.
	* @returns {Canvas} A new Canvas object.
	*/
	static attach(parent = document.body, width = 600, height = 400, options = {}) {
		const canvas = document.createElement("canvas");
		parent.append(canvas);
		return new this(canvas, width, height, options);
	}
	/**
	* New Canvas constructor.
	* @param {HTMLCanvasElement} node The canvas node.
	* @param {number} [width=600] The canvas width.
	* @param {number} [height=400] The canvas height.
	* @param {CanvasOptions} [options={}] Additional canvas options.
	*/
	constructor(node, width = 600, height = 400, options = {}) {
		if (!node || typeof node.addEventListener !== "function") throw new TypeError("Canvas requires a canvas element.");
		const runtime = options.runtime ?? {};
		this.#node = node;
		this.#destroyed = false;
		this.#eventTarget = runtime.eventTarget ?? globalThis.window;
		this.#cancelAnimationFrame = runtime.cancelAnimationFrame ?? this.#eventTarget.cancelAnimationFrame.bind(this.#eventTarget);
		this.#frameId = null;
		this.#listeners = [];
		this.#loop = true;
		this.#mouseX = null;
		this.#mouseY = null;
		this.#mouseDown = /* @__PURE__ */ new Set();
		this.#keysDown = /* @__PURE__ */ new Set();
		this.#now = runtime.now ?? (() => globalThis.performance.now());
		this.#previousTime = null;
		this.#requestAnimationFrame = runtime.requestAnimationFrame ?? this.#eventTarget.requestAnimationFrame.bind(this.#eventTarget);
		this.#startTime = null;
		this.context = new CanvasContext(this.#node, width, height);
		this.#node.setAttribute("tabindex", "1");
		this.#node.style.setProperty("outline", "0");
		this.#events();
		this.setup();
		const run = () => {
			if (this.#destroyed || !this.#loop) return;
			const now = this.#now();
			if (this.#startTime === null) this.#startTime = now;
			const deltaTime = this.#previousTime === null ? 0 : (now - this.#previousTime) / 1e3;
			const elapsedTime = (now - this.#startTime) / 1e3;
			this.#previousTime = now;
			this.update(deltaTime, elapsedTime);
			if (!this.#loop) return;
			this.#frameId = this.#requestAnimationFrame(() => {
				this.#frameId = null;
				run();
			});
		};
		run();
	}
	/**
	* Stop the loop and remove event listeners.
	* @returns {Canvas} The Canvas.
	*/
	destroy() {
		if (this.#destroyed) return this;
		this.noLoop();
		this.#destroyed = true;
		for (const { listener, target, type } of this.#listeners) if (typeof target.removeEventListener === "function") target.removeEventListener(type, listener);
		this.#listeners = [];
		this.#mouseDown.clear();
		this.#keysDown.clear();
		this.#mouseX = null;
		this.#mouseY = null;
		return this;
	}
	/**
	* Determine if a key is being pressed.
	* @param {string} code The key code.
	* @returns {boolean} TRUE if the key is being pressed, otherwise FALSE.
	*/
	isKeyPressed(code) {
		return code ? this.#keysDown.has(code) : this.#keysDown.size > 0;
	}
	/**
	* Determine if a mouse button is being pressed.
	* @param {number} button The mouse button.
	* @returns {boolean} TRUE if the mouse button is being pressed, otherwise FALSE.
	*/
	isMousePressed(button = 0) {
		return this.#mouseDown.has(button) && this.#mouseX !== null && this.#mouseY !== null;
	}
	/**
	* Get the mouse position.
	* @returns {Vector|null} The mouse position.
	*/
	mousePos() {
		if (this.#mouseX === null || this.#mouseY === null) return null;
		return new Vector(this.#mouseX, this.#mouseY);
	}
	/**
	* Stop the update method.
	*/
	noLoop() {
		this.#loop = false;
		if (this.#frameId !== null && typeof this.#cancelAnimationFrame === "function") this.#cancelAnimationFrame(this.#frameId);
		this.#frameId = null;
	}
	/**
	* Key down callback.
	* @param {string} _code The physical keyboard code.
	* @param {KeyboardEvent} _event The native browser event.
	*/
	onKeyDown(_code, _event) {}
	/**
	* Key press callback.
	* @param {string} _key The typed key value.
	* @param {KeyboardEvent} _event The native browser event.
	*/
	onKeyPress(_key, _event) {}
	/**
	* Key up callback.
	* @param {string} _code The physical keyboard code.
	* @param {KeyboardEvent} _event The native browser event.
	*/
	onKeyUp(_code, _event) {}
	/**
	* Mouse click callback.
	* @param {number} _button The mouse button index.
	* @param {MouseEvent} _event The native browser event.
	*/
	onMouseClick(_button, _event) {}
	/**
	* Mouse down callback.
	* @param {number} _button The mouse button index.
	* @param {MouseEvent} _event The native browser event.
	*/
	onMouseDown(_button, _event) {}
	/**
	* Mouse enter callback.
	* @param {MouseEvent} _event The native browser event.
	*/
	onMouseEnter(_event) {}
	/**
	* Mouse leave callback.
	* @param {MouseEvent} _event The native browser event.
	*/
	onMouseLeave(_event) {}
	/**
	* Mouse move callback.
	* @param {number} _x The canvas-local X coordinate.
	* @param {number} _y The canvas-local Y coordinate.
	* @param {MouseEvent} _event The native browser event.
	*/
	onMouseMove(_x, _y, _event) {}
	/**
	* Mouse up callback.
	* @param {number} _button The mouse button index.
	* @param {MouseEvent} _event The native browser event.
	*/
	onMouseUp(_button, _event) {}
	/**
	* Setup callback.
	*/
	setup() {}
	/**
	* Update callback.
	* @param {number} _deltaTime The time elapsed since the previous frame in seconds.
	* @param {number} _elapsedTime The total time elapsed since the loop started in seconds.
	*/
	update(_deltaTime, _elapsedTime) {}
	/**
	* Add an event listener and track it for cleanup.
	* @param {EventTarget} target The event target.
	* @param {string} type The event type.
	* @param {Function} listener The event listener.
	*/
	#addEventListener(target, type, listener) {
		target.addEventListener(type, listener);
		this.#listeners.push({
			listener,
			target,
			type
		});
	}
	/**
	* Attach events for the Canvas.
	*/
	#events() {
		const updateMouse = (e) => {
			if (e.target === this.#node && Number.isFinite(e.offsetX) && Number.isFinite(e.offsetY)) {
				this.#mouseX = e.offsetX;
				this.#mouseY = e.offsetY;
				return;
			}
			if (Number.isFinite(e.clientX) && Number.isFinite(e.clientY)) {
				const bounds = this.#node.getBoundingClientRect();
				this.#mouseX = e.clientX - bounds.left;
				this.#mouseY = e.clientY - bounds.top;
			}
		};
		this.#addEventListener(this.#eventTarget, "mouseup", (e) => {
			if (!this.#mouseDown.has(e.button)) return;
			this.#mouseDown.delete(e.button);
			updateMouse(e);
			this.onMouseUp(e.button, e);
		});
		this.#addEventListener(this.#eventTarget, "keyup", (e) => {
			if (!this.#keysDown.has(e.code)) return;
			this.#keysDown.delete(e.code);
			this.onKeyUp(e.code, e);
		});
		this.#addEventListener(this.#node, "mouseenter", (e) => {
			updateMouse(e);
			this.onMouseEnter(e);
		});
		this.#addEventListener(this.#node, "mouseleave", (e) => {
			updateMouse(e);
			this.onMouseLeave(e);
			this.#mouseX = null;
			this.#mouseY = null;
		});
		this.#addEventListener(this.#node, "mousemove", (e) => {
			updateMouse(e);
			this.onMouseMove(this.#mouseX, this.#mouseY, e);
		});
		this.#addEventListener(this.#node, "mousedown", (e) => {
			this.#mouseDown.add(e.button);
			updateMouse(e);
			this.onMouseDown(e.button, e);
		});
		this.#addEventListener(this.#node, "click", (e) => {
			updateMouse(e);
			this.onMouseClick(e.button, e);
		});
		this.#addEventListener(this.#node, "keydown", (e) => {
			this.#keysDown.add(e.code);
			this.onKeyDown(e.code, e);
			if (!e.repeat && typeof e.key === "string" && e.key.length === 1) this.onKeyPress(e.key, e);
		});
	}
};

export { Canvas, CanvasContext, Path, Shape, Vector };
//# sourceMappingURL=f5.esm.js.map