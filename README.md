# F5

[![CI](https://github.com/frost-js/f5/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/frost-js/f5/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/frost-js/f5/branch/main/graph/badge.svg)](https://codecov.io/gh/frost-js/f5)
[![npm version](https://img.shields.io/npm/v/%40fr0st%2Ff5?style=flat-square)](https://www.npmjs.com/package/@fr0st/f5)
[![npm downloads](https://img.shields.io/npm/dm/%40fr0st%2Ff5?style=flat-square)](https://www.npmjs.com/package/@fr0st/f5)
[![JS gzip size](https://img.badgesize.io/frost-js/f5/main/dist/f5.min.js?compression=gzip&label=JS%20gzip%20size&style=flat-square)](https://github.com/frost-js/f5/blob/main/dist/f5.min.js)
[![license](https://img.shields.io/github/license/frost-js/f5?style=flat-square)](./LICENSE)

Lightweight 2D canvas drawing and animation with paths, layered shapes, hit testing, and mutable vectors.

## Highlights

- Prebuilt ESM and UMD bundles in `dist/`
- Browser UMD bundle exposed as `globalThis.F5`
- Chainable drawing, styling, and transforms
- Animation lifecycle with keyboard and mouse input
- Reusable paths, layered shapes, contours, and hit testing
- Mutable 2D vectors
- No runtime dependencies
- JSDoc-powered IntelliSense

Explore [image annotation](demo/annotation.html), an interactive [seating plan](demo/seating.html), and an animated [delivery map](demo/delivery.html). The [drawing reference](demo/reference.html) collects focused recipes for primitives, styles, paths, and transforms.

## Installation

### Browser projects / bundlers

```bash
npm i @fr0st/f5
```

F5's package entry point is ESM-only. Import the named exports in browser projects and bundlers. Drawing requires a browser DOM with a 2D canvas context and `Path2D`; `Vector` can also be used without a DOM.

```js
import { Canvas, CanvasContext, Path, Shape, Vector } from '@fr0st/f5';
```

### Browser (ESM)

Import the minified ESM bundle directly from your own copy:

```html
<canvas id="canvas"></canvas>
<script type="module">
    import { CanvasContext } from '/path/to/dist/f5.esm.min.js';

    const context = new CanvasContext(document.getElementById('canvas'), 600, 400);
    context.noStroke().fill('#2673dd').circle(300, 200, 60);
</script>
```

### Browser (UMD)

Load the bundle from your own copy or a CDN:

```html
<canvas id="canvas"></canvas>
<script src="/path/to/dist/f5.min.js"></script>
<!-- or -->
<script src="https://cdn.jsdelivr.net/npm/@fr0st/f5@latest/dist/f5.min.js"></script>
<script>
    const context = new F5.CanvasContext(document.getElementById('canvas'), 600, 400);
    context.noStroke().fill('#2673dd').circle(300, 200, 60);
</script>
```

The UMD bundle exposes `globalThis.F5` with `Canvas`, `CanvasContext`, `Path`, `Shape`, and `Vector`. The ESM bundle exports the same five classes as named exports; there is no default export.

The package root resolves to the prebuilt ESM bundle. Published files under `dist/` and `src/` are also available through matching package subpaths.

## Usage

### Drawing

Add a canvas to your page:

```html
<canvas id="canvas"></canvas>
```

Use the named ESM exports:

```js
import { CanvasContext, Vector } from '@fr0st/f5';

const context = new CanvasContext(document.getElementById('canvas'), 600, 400);
const center = Vector.create(300, 200);

context.background('#f4f6f8')
    .noStroke()
    .fill('#2673dd')
    .circle(center.x, center.y, 60);
```

### Animation

Subclass `Canvas` to implement `setup()` and `update(deltaTime, elapsedTime)`:

```js
import { Canvas } from '@fr0st/f5';

class Sketch extends Canvas {
    setup() {
        this.x = 0;
    }

    update(deltaTime, elapsedTime) {
        this.x = (this.x + deltaTime * 100) % 600;
        this.context.background('#f4f6f8')
            .noStroke()
            .fill('#2673dd')
            .circle(this.x, 200 + Math.sin(elapsedTime) * 40, 20);
    }
}

const sketch = Sketch.attach(document.body, 600, 400);
// Call sketch.dispose() when the sketch is removed or its owner is disposed.
```

For an existing canvas, construct the sketch and then start it:

```js
const sketch = new Sketch(document.getElementById('canvas'), 600, 400);
sketch.start();
```

`attach()` starts the sketch automatically after construction finishes.

## API

### Canvas

Subclass `Canvas` to implement `setup()` and `update(deltaTime, elapsedTime)`. The `context` property is a `CanvasContext`.

| Signature | Description |
| --- | --- |
| `new Canvas(node, width = 600, height = 400, options = {})` | Wrap an existing canvas without starting input or lifecycle hooks |
| `Canvas.attach(parent = document.body, width = 600, height = 400, options = {})` | Create and append a canvas, construct the sketch, and call `start()` |
| `start()` | Start input, call `setup()`, and begin updates once; return the instance |
| `setup()` | Initialization hook called once by `start()` |
| `update(deltaTime, elapsedTime)` | Animation hook receiving time in seconds |
| `noLoop()` | Stop future updates |
| `dispose()` | Stop updates, remove listeners, and clear input state; returns nothing |
| `isKeyPressed(code)` | Check a physical key, or any key when omitted |
| `isMousePressed(button = 0)` | Check a button while the pointer is inside the canvas |
| `mousePos()` | Return the pointer position as a `Vector`, or `null` outside the canvas |

Input hooks receive the native event as their last argument:

| Hook | Arguments before the event |
| --- | --- |
| `onKeyDown`, `onKeyUp` | Physical key code, such as `KeyA` |
| `onKeyPress` | Typed key value, such as `a` |
| `onMouseClick`, `onMouseDown`, `onMouseUp` | Button index |
| `onMouseMove` | Canvas-local `x`, `y` |
| `onMouseEnter`, `onMouseLeave` | None |

Click or tab to the canvas to focus it for keyboard input. Existing `tabindex` and focus styles are preserved. Mouse positions use canvas drawing units, including when CSS scales the canvas.

The optional fourth constructor argument, or fourth argument to `Canvas.attach`, accepts `{ runtime }`. A custom runtime may supply `now()` in milliseconds, `requestAnimationFrame(callback)`, `cancelAnimationFrame(id)`, and `eventTarget`. Supply matching scheduling/cancellation functions together. This supports deterministic tests and custom browser embedding; defaults use the canvas element’s owning window for timing and events. Custom event targets must support the `addEventListener` `signal` option so disposal removes their listeners.

### CanvasContext

```js
new CanvasContext(node, width = 600, height = 400, options = {});
```

Wrap a canvas element with chainable drawing and style methods. Set `CanvasContext.defaults` properties before construction to customize application-wide defaults. Each context copies the defaults and applies its own options; `reset()` restores the current shared defaults. Constructor options use these defaults:

| Option | Default | Description |
| --- | --- | --- |
| `fillStyle` | `null` | Fill color, gradient, or pattern; `null` disables fill |
| `strokeStyle` | `'#000'` | Stroke color, gradient, or pattern; `null` disables stroke |
| `lineWidth` | `1` | Stroke width |
| `font` | `'sans-serif'` | Font family |
| `fontSize` | `10` | Font size in pixels |
| `fontWeight` | `null` | Optional font weight |
| `textAlign` | `'start'` | Horizontal text alignment |
| `textBaseline` | `'alphabetic'` | Vertical text alignment |
| `shadowColor` | `null` | Shadow color |
| `shadowBlur` | `0` | Shadow blur amount |
| `shadowOffsetX`, `shadowOffsetY` | `0` | Shadow offsets |

Drawing methods:

| Signature | Description |
| --- | --- |
| `arc(x, y, radius, startAngle, endAngle)` | Circular arc |
| `bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2)` | Cubic Bézier curve |
| `circle(x, y, radius)` | Circle centered at `(x, y)` |
| `curve(x1, y1, cx1, cy1, cx2, cy2, radius)` | Tangent arc from a starting point |
| `ellipse(x, y, width, height, angle = 0)` | Ellipse centered at `(x, y)` |
| `line(x1, y1, x2, y2)` | Line segment |
| `point(x, y)` | Dot using the stroke color and width |
| `quad(x1, y1, x2, y2, x3, y3, x4, y4)` | Quadrilateral |
| `rect(x, y, width, height)` | Rectangle |
| `square(x, y, size)` | Square |
| `triangle(x1, y1, x2, y2, x3, y3)` | Triangle |
| `begin()`, `end(close = false)` | Begin a connected path and draw it, optionally closing it |
| `vertex(x, y)` | Move to the first vertex, then connect subsequent vertices |
| `bezierVertex(cx1, cy1, cx2, cy2, x, y)` | Append a cubic Bézier segment |
| `quadraticVertex(cx, cy, x, y)` | Append a quadratic Bézier segment |
| `curveVertex(cx1, cy1, cx2, cy2, radius)` | Append a tangent arc |

Styles, transforms, and utilities:

| Signatures | Description |
| --- | --- |
| `fill(color)`, `noFill()` | Set or disable fill |
| `stroke(color)`, `noStroke()`, `strokeWidth(width)` | Configure stroke |
| `shadow(color)`, `noShadow()`, `shadowBlur(amount)`, `shadowOffset(x = 0, y = 0)` | Configure shadows |
| `font(font)`, `fontSize(size)`, `fontWeight(weight)` | Configure font |
| `textAlign(alignment)`, `textBaseline(baseline)`, `text(text, x, y)` | Position and draw text |
| `translate(x, y)`, `rotate(angle)`, `scale(x, y = x)` | Transform subsequent drawing |
| `applyMatrix(a, b, c, d, e, f)`, `resetMatrix()` | Apply or reset a transform |
| `push()`, `pop()` | Save or restore transform and style state |
| `reset()` | Restore default drawing options and reset the transform |
| `resize(width, height)` | Resize the canvas, clearing pixels and saved state |
| `getOptions()` | Return a copy of the active drawing options |
| `background(color)`, `clear()` | Fill or clear the whole canvas |
| `erase(callback)` | Erase geometry drawn by a callback receiving a new `Path` |
| `drawImage(image, x = 0, y = 0)` | Draw an image |
| `getImage(sx, sy, sw, sh)` | Read an `ImageData` region |
| `putImage(image, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight)` | Write `ImageData`; omit the last four arguments to write the whole image |
| `linearGradient(x1, y1, x2, y2)` | Create a linear `CanvasGradient` |
| `radialGradient(x1, y1, r1, x2, y2, r2)` | Create a radial `CanvasGradient` |
| `createPath()` | Create a retained `Path` |
| `createShape(x = 0, y = 0, angle = 0, anchorX = 0, anchorY = 0)` | Create a layered `Shape` |
| `drawPath(path, x = 0, y = 0)`, `drawShape(shape, x = 0, y = 0)` | Render geometry with the current styles and an optional drawing offset |

### Path and Shape

Create geometry through a context so hit testing uses its native 2D context:

```js
const path = context.createPath().rect(10, 20, 80, 40);
console.log(path.containsPoint(20, 30)); // true
console.log(path.getBoundingBox());
context.fill('#2673dd').drawPath(path);

const shape = context.createShape(150, 100)
    .layer((layer) => layer.circle(0, 0, 50))
    .contour((hole) => hole.circle(0, 0, 20));
context.drawShape(shape);
```

| Signature | Description |
| --- | --- |
| `new Path(context)` | Create a path using a native 2D context for hit testing |
| `new Shape(context, x = 0, y = 0, angle = 0, anchorX = 0, anchorY = 0)` | Create a shape using a native 2D context |
| `path.close()` | Close the current subpath |
| `shape.layer(callback, contour = false)` | Add a layer; the callback receives a new `Path` |
| `shape.contour(callback)` | Add an erasing contour; the callback receives a new `Path` |
| `containsPoint(x, y)` | Test a point against the path or shape |
| `getBoundingBox()` | Return `{ top, right, bottom, left, x, y, width, height }` |
| `render(options = {}, pixelRatio = 1)` | Render the path or shape into a separate canvas at the requested pixel density |

`Path` supports the primitive and vertex signatures listed under `CanvasContext`, except `point`, `begin`, and `end`. Use `close()` to close a retained path. Geometry-building methods return the path or shape for chaining.

Shape properties `x`, `y`, `angle`, `anchorX`, and `anchorY` control position and rotation. `shape.containsPoint(x, y)` accepts global coordinates.

Rendering options are `fillStyle`, `strokeStyle`, `lineWidth`, `shadowColor`, `shadowBlur`, `shadowOffsetX`, and `shadowOffsetY`. Supply a fill or stroke to render visible geometry, and an explicit `lineWidth` when using a stroke. `CanvasContext.drawPath()` and `drawShape()` supply the current drawing options and choose a rendering resolution from the active transform automatically. When calling `render()` directly, `pixelRatio` must be a positive, finite number; it controls the output resolution without changing the geometry coordinates or bounds.

### Vector

```js
import { Vector } from '@fr0st/f5';

const velocity = Vector.create(3, 4);
console.log(velocity.getMag()); // 5
const direction = velocity.clone().normalize();
const position = Vector.create(10, 20).add(velocity);
```

| Signature | Description |
| --- | --- |
| `new Vector(x = 0, y = 0)`, `Vector.create(x = 0, y = 0)` | Create a vector with public `x` and `y` components |
| `Vector.parse(x = 0, y = 0)` | Return an existing vector unchanged, or create one from components |
| `Vector.random()` | Create a vector with each component sampled independently from `[0, 1)` |
| `clone()` | Return an independent copy |
| `add(x, y)`, `sub(x, y)`, `mult(x, y)`, `div(x, y)` | Apply component-wise arithmetic |
| `dot(x, y)`, `distTo(x, y)`, `angleTo(x, y)` | Return the dot product, distance, or difference in headings |
| `getMag()`, `getHeading()` | Return the magnitude or heading |
| `setMag(mag)`, `setHeading(angle)` | Set magnitude or heading, preserving the other |
| `normalize()`, `limit(mag)` | Set magnitude to 1 or limit its maximum |
| `rotate(angle)` | Rotate while preserving magnitude |

Arithmetic, dot product, distance, and angle methods accept a vector or separate X/Y components. Arithmetic and magnitude/heading changes mutate the vector and return it; use `clone()` to preserve the original.

## Behavior notes

- Drawing coordinates are canvas units; angles are radians. `circle` takes a radius, while `ellipse` takes width and height.
- Construction prepares the canvas and context without registering input listeners or calling lifecycle hooks. Call `start()` after construction completes; `attach()` does this automatically. Subclass fields and private members are initialized before the hooks run.
- `start()` synchronously calls `setup()`, followed by the first `update()` unless `noLoop()` or `dispose()` was called. Repeated calls do nothing, including after disposal or failed startup. Update times are in seconds, with zero delta and elapsed time on the first update.
- `noLoop()` stops future updates. `dispose()` also removes listeners and clears input state; repeated disposal is safe. Neither removes the canvas element, and there is no loop restart method.
- If startup fails, the sketch is disposed and the error is rethrown. `Canvas.attach()` removes its generated canvas if construction or startup fails; a caller-owned canvas remains in place.
- `push()` and `pop()` save and restore transforms and styles. `resize()` clears pixels and saved state; `reset()` restores drawing defaults and the transform without clearing pixels.
- Shapes compose ordered layers and contours; contours erase earlier layers. Empty geometry has zero-sized bounds. Shape bounds enclose rotated layer bounding boxes and may be conservative around curves.
- Rendering expands and rounds bounds for strokes and shadows; geometric bounding boxes exclude that padding.
- `Vector.random()` does not return a unit vector. `angleTo()` returns the other heading minus the current heading without wrapping the result.

## Development

Install dependencies with `npm ci`, then install Playwright browsers with `npx playwright install --with-deps`.

```bash
npm test
npm run lint
npm run build
```

`npm test` rebuilds the bundles, runs the geometry and lifecycle unit tests once, then runs the browser suite in Chromium, Firefox, and WebKit. Both suites use Playwright. `npm run test:unit` runs without a browser or web server. `npm run test:browser` runs against the existing bundles, so rebuild after changing source files.

After building, `npm run test:coverage` runs Chromium tests and writes coverage reports to `coverage/`.

`npm run test:headed` and `npm run test:ui` also use the existing bundles and open headed browsers or the Playwright UI.

To view the demo, open `demo/index.html` in your browser after building.

## License

F5 is released under the [MIT License](./LICENSE).
