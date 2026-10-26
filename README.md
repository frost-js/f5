# F5

[![CI](https://github.com/frost-js/f5/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/frost-js/f5/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/frost-js/f5/branch/main/graph/badge.svg)](https://codecov.io/gh/frost-js/f5)
[![npm version](https://img.shields.io/npm/v/%40fr0st%2Ff5?style=flat-square)](https://www.npmjs.com/package/@fr0st/f5)
[![npm downloads](https://img.shields.io/npm/dm/%40fr0st%2Ff5?style=flat-square)](https://www.npmjs.com/package/@fr0st/f5)
[![JS gzip size](https://img.badgesize.io/frost-js/f5/main/dist/f5.min.js?compression=gzip&label=JS%20gzip%20size&style=flat-square)](https://github.com/frost-js/f5/blob/main/dist/f5.min.js)
[![license](https://img.shields.io/github/license/frost-js/f5?style=flat-square)](./LICENSE)

Lightweight 2D canvas drawing and animation with paths, layered shapes, hit testing, and mutable vectors.

## Highlights

- Chainable drawing, styling, and transforms
- Animation lifecycle with keyboard and mouse input
- Reusable paths, layered shapes, contours, and hit testing
- Mutable 2D vectors
- Prebuilt ESM and UMD bundles with source maps
- No runtime dependencies or required stylesheets
- JSDoc-powered IntelliSense

Explore [the demo](./demo/index.html) for interactive examples.

## Installation

### Browser projects / bundlers

```bash
npm i @fr0st/f5
```

F5's package entry point is ESM-only. Drawing requires a browser DOM with Canvas 2D support and `Path2D`. Import the named exports in browser projects and bundlers:

```js
import { Canvas, CanvasContext, Path, Shape, Vector } from '@fr0st/f5';
```

`Vector` can also be used without a DOM. F5 has no runtime dependencies and does not require a stylesheet.

### Browser (ESM)

Import the minified ESM bundle directly from a CDN:

```html
<script type="module">
    import { Canvas, CanvasContext, Path, Shape, Vector } from 'https://cdn.jsdelivr.net/npm/@fr0st/f5@latest/dist/f5.esm.min.js';
</script>
```

### Browser (UMD)

Load the bundle from your own copy or a CDN:

```html
<script src="/path/to/dist/f5.min.js"></script>
<!-- or -->
<script src="https://cdn.jsdelivr.net/npm/@fr0st/f5@latest/dist/f5.min.js"></script>
<script>
    const { Canvas, CanvasContext, Path, Shape, Vector } = globalThis.F5;
</script>
```

The UMD bundle exposes `globalThis.F5`.

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
```

## Options

### CanvasContext

Drawing options are resolved in this order:

1. `CanvasContext.defaults`
2. Options passed to the constructor

Each context copies the defaults and applies its own options. `getOptions()` returns a copy of the active options, and `reset()` restores the current shared defaults.

`CanvasContext.defaults` may be customized before creating instances. See [src/canvas-context.js](./src/canvas-context.js) for the complete defaults.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `fillStyle` | `string \| CanvasGradient \| CanvasPattern \| null` | `null` | Fill color, gradient, or pattern; `null` disables fill. |
| `strokeStyle` | `string \| CanvasGradient \| CanvasPattern \| null` | `'#000'` | Stroke color, gradient, or pattern; `null` disables stroke. |
| `lineWidth` | `number` | `1` | Stroke width in canvas units. |
| `font` | `string` | `'sans-serif'` | Font family. |
| `fontSize` | `number` | `10` | Font size in canvas units. |
| `fontWeight` | `string \| number \| null` | `null` | Optional font weight. |
| `textAlign` | `CanvasTextAlign` | `'start'` | Horizontal text alignment. |
| `textBaseline` | `CanvasTextBaseline` | `'alphabetic'` | Vertical text alignment. |
| `shadowColor` | `string \| null` | `null` | Shadow color. |
| `shadowBlur` | `number` | `0` | Shadow blur amount. |
| `shadowOffsetX`, `shadowOffsetY` | `number` | `0` | Shadow offsets. |

### Canvas

The fourth argument to the constructor or `Canvas.attach()` accepts lifecycle options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `runtime` | `object` | `{}` | Optional timing, animation scheduling, and global input overrides. |

By default, timing and events use the canvas element's owning window. A custom runtime may supply `now()` in milliseconds, `requestAnimationFrame(callback)`, `cancelAnimationFrame(id)`, and `eventTarget`. Supply matching scheduling and cancellation functions together. Custom event targets must support the `addEventListener` `signal` option. See [src/canvas.js](./src/canvas.js) for the runtime contract.

## Methods

### Canvas

An instance exposes its drawing context as `instance.context`, a `CanvasContext`. Override `setup()` and `update(deltaTime, elapsedTime)` to implement a sketch.

| Method | Returns | Description |
| --- | --- | --- |
| `new Canvas(node, width = 600, height = 400, options = {})` | `Canvas` | Wrap an existing canvas without starting input or lifecycle hooks. |
| `Canvas.attach(parent = document.body, width = 600, height = 400, options = {})` | `Canvas` | Create and append a canvas, construct the sketch, and call `start()`. |
| `start()` | `Canvas` | Start input, call `setup()`, and begin updates once. |
| `setup()` | `void` | Initialization hook called once by `start()`. |
| `update(deltaTime, elapsedTime)` | `void` | Animation hook receiving time in seconds. |
| `noLoop()` | `void` | Stop future updates. |
| `dispose()` | `void` | Stop updates, remove listeners, and clear input state. |
| `isKeyPressed(code)` | `boolean` | Check a physical key, or any key when omitted. |
| `isMousePressed(button = 0)` | `boolean` | Check whether a mouse button is tracked as pressed with available pointer coordinates. |
| `mousePos()` | `Vector \| null` | Return the last tracked pointer position, or `null` when no position is available. |

Input hooks return `void` and receive the native browser event as their last argument:

| Method | Returns | Description |
| --- | --- | --- |
| `onKeyDown(code, event)`, `onKeyUp(code, event)` | `void` | Receive a physical key code, such as `KeyA`. |
| `onKeyPress(key, event)` | `void` | Receive a single typed character, excluding repeated keydown events. |
| `onMouseClick(button, event)`, `onMouseDown(button, event)`, `onMouseUp(button, event)` | `void` | Receive a mouse button index. |
| `onMouseMove(x, y, event)` | `void` | Receive canvas-local coordinates. |
| `onMouseEnter(event)`, `onMouseLeave(event)` | `void` | Receive pointer entry and exit events. |

Mouse positions use canvas drawing units, including when CSS scales the canvas. Leaving the canvas clears the tracked position. Releasing a tracked mouse button outside the canvas updates it to the release coordinates, which can lie outside the canvas bounds. `dispose()` clears the position too.

### CanvasContext

Wrap a canvas element with chainable drawing and style methods. Drawing coordinates are canvas units and angles are radians. `circle()` takes a radius; `ellipse()` takes width and height.

Canvas dimensions set the pixel buffer size. For responsive or high-DPI output, size the buffer for the displayed dimensions and pixel density, then scale the drawing coordinates. The [drawing reference](./demo/assets/reference.js) demonstrates this setup.

Drawing methods:

| Method | Returns | Description |
| --- | --- | --- |
| `new CanvasContext(node, width = 600, height = 400, options = {})` | `CanvasContext` | Create a drawing context. |
| `arc(x, y, radius, startAngle, endAngle)` | `CanvasContext` | Circular arc. |
| `bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2)` | `CanvasContext` | Cubic Bézier curve. |
| `circle(x, y, radius)` | `CanvasContext` | Circle centered at `(x, y)`. |
| `curve(x1, y1, cx1, cy1, cx2, cy2, radius)` | `CanvasContext` | Tangent arc from a starting point. |
| `ellipse(x, y, width, height, angle = 0)` | `CanvasContext` | Ellipse centered at `(x, y)`. |
| `line(x1, y1, x2, y2)` | `CanvasContext` | Line segment. |
| `point(x, y)` | `CanvasContext` | Dot using the stroke color and width. |
| `quad(x1, y1, x2, y2, x3, y3, x4, y4)` | `CanvasContext` | Quadrilateral. |
| `rect(x, y, width, height)` | `CanvasContext` | Rectangle. |
| `square(x, y, size)` | `CanvasContext` | Square. |
| `triangle(x1, y1, x2, y2, x3, y3)` | `CanvasContext` | Triangle. |
| `begin()`, `end(close = false)` | `CanvasContext` | Begin a connected path and draw it, optionally closing it. |
| `vertex(x, y)` | `CanvasContext` | Move to the first vertex, then connect subsequent vertices. |
| `bezierVertex(cx1, cy1, cx2, cy2, x, y)` | `CanvasContext` | Append a cubic Bézier segment. |
| `quadraticVertex(cx, cy, x, y)` | `CanvasContext` | Append a quadratic Bézier segment. |
| `curveVertex(cx1, cy1, cx2, cy2, radius)` | `CanvasContext` | Append a tangent arc. |

Styles, transforms, and utilities:

| Method | Returns | Description |
| --- | --- | --- |
| `fill(color)`, `noFill()` | `CanvasContext` | Set or disable fill. |
| `stroke(color)`, `noStroke()`, `strokeWidth(width)` | `CanvasContext` | Configure stroke. |
| `shadow(color)`, `noShadow()`, `shadowBlur(amount)`, `shadowOffset(x = 0, y = 0)` | `CanvasContext` | Configure shadows. |
| `font(font)`, `fontSize(size)`, `fontWeight(weight)` | `CanvasContext` | Configure font. |
| `textAlign(alignment)`, `textBaseline(baseline)`, `text(text, x, y)` | `CanvasContext` | Position and draw text. |
| `translate(x, y)`, `rotate(angle)`, `scale(x, y = x)` | `CanvasContext` | Transform subsequent drawing. |
| `applyMatrix(a, b, c, d, e, f)`, `resetMatrix()` | `CanvasContext` | Apply or reset a transform. |
| `push()`, `pop()` | `CanvasContext` | Save or restore transform and style state. |
| `reset()` | `CanvasContext` | Restore default drawing options and reset the transform. |
| `resize(width, height)` | `CanvasContext` | Resize the canvas, clearing pixels and saved state. |
| `getOptions()` | `object` | Return a copy of the active drawing options. |
| `background(color)`, `clear()` | `CanvasContext` | Fill or clear the whole canvas. |
| `erase(callback)` | `CanvasContext` | Erase geometry drawn by a callback receiving a new `Path`. |
| `drawImage(image, x = 0, y = 0)` | `CanvasContext` | Draw an image. |
| `getImage(sx, sy, sw, sh)` | `ImageData` | Read an `ImageData` region. |
| `putImage(image, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight)` | `CanvasContext` | Write `ImageData`; omit the last four arguments to write the whole image. |
| `linearGradient(x1, y1, x2, y2)` | `CanvasGradient` | Create a linear `CanvasGradient`. |
| `radialGradient(x1, y1, r1, x2, y2, r2)` | `CanvasGradient` | Create a radial `CanvasGradient`. |
| `createPath()` | `Path` | Create a retained `Path`. |
| `createShape(x = 0, y = 0, angle = 0, anchorX = 0, anchorY = 0)` | `Shape` | Create a layered `Shape`. |
| `drawPath(path, x = 0, y = 0)`, `drawShape(shape, x = 0, y = 0)` | `CanvasContext` | Render geometry with the current styles and an optional drawing offset. |

`push()` and `pop()` save and restore transforms and styles. `resize()` clears pixels and saved state; `reset()` restores drawing defaults and the transform without clearing pixels.

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

| Method | Returns | Description |
| --- | --- | --- |
| `new Path(context)` | `Path` | Create a path using a native 2D context for hit testing. |
| `new Shape(context, x = 0, y = 0, angle = 0, anchorX = 0, anchorY = 0)` | `Shape` | Create a shape using a native 2D context. |
| `path.close()` | `Path` | Close the current subpath. |
| `shape.layer(callback, contour = false)` | `Shape` | Add a layer; the callback receives a new `Path`. |
| `shape.contour(callback)` | `Shape` | Add an erasing contour; the callback receives a new `Path`. |
| `containsPoint(x, y)` | `boolean` | Test a point against the path or shape. |
| `getBoundingBox()` | `object` | Return `{ top, right, bottom, left, x, y, width, height }`. |
| `render(options = {}, pixelRatio = 1)` | `HTMLCanvasElement` | Render the path or shape into a separate canvas at the requested pixel density. |

`Path` supports the primitive and vertex signatures listed under `CanvasContext`, except `point`, `begin`, and `end`. Use `close()` to close a retained path. Geometry-building methods return the path or shape for chaining.

Shape properties `x`, `y`, `angle`, `anchorX`, and `anchorY` control position and rotation. `shape.containsPoint(x, y)` accepts global coordinates.

Shapes compose ordered layers and contours; contours erase earlier layers. Empty geometry has zero-sized bounds. Shape bounds enclose rotated layer bounding boxes and may be conservative around curves. Rendering expands and rounds bounds for strokes and shadows; geometric bounding boxes exclude that padding.

Rendering options are `fillStyle`, `strokeStyle`, `lineWidth`, `shadowColor`, `shadowBlur`, `shadowOffsetX`, and `shadowOffsetY`. Supply a fill or stroke to render visible geometry, and an explicit `lineWidth` when using a stroke. `CanvasContext.drawPath()` and `drawShape()` supply the current drawing options and choose a rendering resolution from the active transform automatically. When calling `render()` directly, `pixelRatio` must be a positive, finite number; it controls the output resolution without changing the geometry coordinates or bounds.

### Vector

```js
import { Vector } from '@fr0st/f5';

const velocity = Vector.create(3, 4);
console.log(velocity.getMag()); // 5
const direction = velocity.clone().normalize();
const position = Vector.create(10, 20).add(velocity);
```

| Method | Returns | Description |
| --- | --- | --- |
| `new Vector(x = 0, y = 0)`, `Vector.create(x = 0, y = 0)` | `Vector` | Create a vector with public `x` and `y` components. |
| `Vector.parse(x = 0, y = 0)` | `Vector` | Return an existing vector unchanged, or create one from components. |
| `Vector.random()` | `Vector` | Create a vector with each component sampled independently from `[0, 1)`. |
| `clone()` | `Vector` | Return an independent copy. |
| `add(x, y)`, `sub(x, y)`, `mult(x, y)`, `div(x, y)` | `Vector` | Apply component-wise arithmetic. |
| `dot(x, y)`, `distTo(x, y)`, `angleTo(x, y)` | `number` | Return the dot product, distance, or difference in headings. |
| `getMag()`, `getHeading()` | `number` | Return the magnitude or heading. |
| `setMag(mag)`, `setHeading(angle)` | `Vector` | Set magnitude or heading, preserving the other. |
| `normalize()`, `limit(mag)` | `Vector` | Set magnitude to 1 or limit its maximum. |
| `rotate(angle)` | `Vector` | Rotate while preserving magnitude. |

Arithmetic, dot product, distance, and angle methods accept a vector or separate X/Y components. Arithmetic and magnitude/heading changes mutate the vector and return it; use `clone()` to preserve the original.

`Vector.random()` does not return a unit vector. `angleTo()` returns the other heading minus the current heading without wrapping the result.

## Lifecycle

Constructing a `Canvas` prepares the canvas and context. Call `start()` after construction to register input listeners, call `setup()`, and begin updates. `Canvas.attach()` creates a canvas and starts the sketch automatically after subclass initialization finishes.

For an existing canvas, construct the sketch and then start it:

```js
const sketch = new Sketch(document.getElementById('canvas'), 600, 400);
sketch.start();
```

`start()` synchronously calls `setup()`, followed by the first `update()` unless `noLoop()` or `dispose()` was called. Update times are in seconds, with zero delta and elapsed time on the first update. Repeated calls to `start()` do nothing, including after disposal or failed startup.

`noLoop()` stops future updates while retaining input listeners. `dispose()` also removes listeners and clears input state. Neither removes the canvas element, and there is no loop restart method. Repeated disposal is safe. Call `dispose()` before removing the canvas from the DOM.

If startup fails, the sketch releases its resources before rethrowing the error. `Canvas.attach()` removes its generated canvas if construction or startup fails; a caller-owned canvas remains in place.

## Accessibility

Applications supply canvas roles, accessible names, and fallback content. For a static drawing, use `role="img"` with a meaningful accessible label and a text description of the information it conveys.

`Canvas` adds `tabindex="0"` when no tab index is present. Click or tab to the canvas to focus it for keyboard input; existing tab order and focus styles are preserved. Provide keyboard alternatives and native controls for interactive drawings, with visible focus indicators.

Applications handle `prefers-reduced-motion`. Check the preference when creating a sketch and offer a static rendering or reduced animation when requested. F5 does not disable animation automatically.

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
