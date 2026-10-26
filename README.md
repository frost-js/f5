# F5

Lightweight 2D canvas drawing and animation with paths, layered shapes, hit testing, and mutable vectors. F5 has no runtime dependencies.

## Installation

```sh
npm install @fr0st/f5
```

Build tooling requires Node.js `^20.19.0 || ^22.13.0 || >=24`. The Vite build uses the sibling Frost packages' `baseline-widely-available` browser target. Canvas drawing requires a browser with a 2D canvas context and `Path2D`; importing ESM in Node does not provide those browser APIs.

## Quick start

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

For a plain script tag, the UMD bundle exposes the same five classes on `window.F5`:

```html
<canvas id="canvas"></canvas>
<script src="node_modules/@fr0st/f5/dist/f5.min.js"></script>
<script>
    const context = new F5.CanvasContext(document.getElementById('canvas'), 600, 400);
    context.noStroke().fill('#2673dd').circle(300, 200, 60);
</script>
```

The public exports are `Canvas`, `CanvasContext`, `Path`, `Shape`, and `Vector`. There is no default export.

## Animation and input

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
// Call sketch.destroy() when the sketch is removed or its owner is disposed.
```

`setup()` and the first `update()` run during construction. Initialize sketch state in `setup()` so it is available to that first update. Both time arguments are in **seconds**, with zero delta and elapsed time on the first update. Drawing coordinates are canvas units; angles are **radians**.

`noLoop()` stops future updates. `destroy()` also removes listeners and clears input state; repeated destruction is safe. These methods do not remove the canvas element. There is no loop restart method.

Input hooks receive the native event as their last argument:

| Hook | Arguments before the event |
| --- | --- |
| `onKeyDown`, `onKeyUp` | Physical key code, such as `KeyA` |
| `onKeyPress` | Typed key value, such as `a` |
| `onMouseClick`, `onMouseDown`, `onMouseUp` | Button index |
| `onMouseMove` | Canvas-local `x`, `y` |
| `onMouseEnter`, `onMouseLeave` | None |

`isKeyPressed(code)` checks a physical key; omit the code to check any key. `isMousePressed(button = 0)` checks a button while the pointer is inside the canvas. `mousePos()` returns a `Vector`, or `null` outside the canvas. Click the canvas to focus it for keyboard input.

The optional fourth constructor argument, or fourth argument to `Canvas.attach`, accepts `{ runtime }`. A custom runtime may supply `now()` in milliseconds, `requestAnimationFrame(callback)`, `cancelAnimationFrame(id)`, and `eventTarget`. Supply matching scheduling/cancellation functions together. This supports deterministic tests and custom browser embedding; defaults use browser timing and window events.

## Drawing

`CanvasContext` wraps a canvas element and defaults to 600 by 400 units. Its drawing and style methods are chainable. Fill is initially disabled; the default stroke is black with width 1.

- Primitives: `arc`, `bezier`, `circle`, `curve`, `ellipse`, `line`, `point`, `quad`, `rect`, `square`, `triangle`.
- Paths: `begin`, `vertex`, `bezierVertex`, `quadraticVertex`, `curveVertex`, `end`.
- Styles: `fill`, `noFill`, `stroke`, `noStroke`, `strokeWidth`, `shadow`, `noShadow`, `shadowBlur`, `shadowOffset`.
- Transforms: `translate`, `rotate`, `scale`, `applyMatrix`, `resetMatrix`, `push`, `pop`.
- Text: `text`, `font`, `fontSize`, `fontWeight`, `textAlign`, `textBaseline`.
- Images and clearing: `drawImage`, `getImage`, `putImage`, `background`, `clear`, `erase`.

`circle` takes a radius; `ellipse` takes width and height. `push()` saves transform and style state; `pop()` restores it. `resize(width, height)` clears saved state and resets the underlying canvas. `getOptions()` returns a copy of the active drawing options. See [CanvasContext](src/canvas-context.js) for signatures and [the demos](demo/index.html) for examples.

## Paths and shapes

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

Paths support primitives and connected vertices. Shapes compose ordered filled layers and contours; contours erase earlier layers. Shape properties `x`, `y`, `angle`, `anchorX`, and `anchorY` control position and rotation. `containsPoint(x, y)` on a shape accepts global coordinates.

`getBoundingBox()` returns `{ top, right, bottom, left, x, y, width, height }`. Empty geometry has zero-sized bounds. Shape bounds enclose its rotated layer bounding boxes and may be conservative around curves.

`path.render(options)` and `shape.render(options)` return a separate canvas. Options include `fillStyle`, `strokeStyle`, `lineWidth`, `shadowColor`, `shadowBlur`, `shadowOffsetX`, and `shadowOffsetY`. Supply a fill or stroke to render visible geometry. Rendering expands and rounds bounds to accommodate strokes and shadows; geometric bounding boxes exclude that padding.

## Vectors

```js
import { Vector } from '@fr0st/f5';

const velocity = Vector.create(3, 4);
console.log(velocity.getMag()); // 5
const direction = velocity.clone().normalize();
const position = Vector.create(10, 20).add(velocity);
```

Arithmetic and rotation methods mutate the vector and return it. Use `clone()` when the original must remain unchanged. `add`, `sub`, `mult`, and `div` accept a vector or separate X/Y components. `dot`, `distTo`, `angleTo`, `getMag`, and `getHeading` return numbers. `Vector.random()` samples each component independently from `[0, 1)`; it does not return a unit vector.

## Development

```sh
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run lint
npm test
npm run test:coverage
```

| Command | Behavior |
| --- | --- |
| `npm run build` | Builds ESM and UMD, minified and unminified, with source maps |
| `npm run lint` | Checks source, configuration, demo scripts, and test JavaScript |
| `npm test` | Builds once, then runs unit and three-browser tests |
| `npm run test:unit` | Runs module and lifecycle tests without launching browsers |
| `npm run test:browser` | Tests existing bundles in Chromium, Firefox, and WebKit |
| `npm run test:coverage` | Runs Chromium browser tests with Monocart source coverage |
| `npm run test:headed` | Runs browser tests with visible browsers |
| `npm run test:ui` | Opens the Playwright test UI |

Run `npm run build` before the standalone browser, coverage, headed, or UI commands. To select one browser, use `npm run test:browser -- --project=chromium`.

Tests use `test/unit`, `test/browser`, shared setup in `test/setup`, and fixtures/server files in `test/support`. Browser tests exercise the built UMD library; distribution checks also verify ESM, minified UMD, and source imports. The browser fixture checks uncaught errors and cleans up its sketch.

Coverage is collected from the unminified UMD bundle and mapped to `src/`. Reports are written to `coverage/` (HTML and LCOV) and `test-results/coverage/`. This is **browser coverage**, not a merged unit/browser total: unit-only geometry branches remain uncovered in that report. Codecov compares against the recorded project coverage, while patch coverage is informational.

To browse the self-contained demos:

```sh
npm run build
node test/support/server/static-server.js
```

Open `http://127.0.0.1:4173/demo/index.html`. Set `PORT` to change the server and Playwright port.

## Distribution and compatibility

The build writes `f5.esm.js`, `f5.esm.min.js`, `f5.js`, and `f5.min.js`, each with a `.map` file. Keep `dist/` committed: CI rebuilds it and rejects stale or untracked bundles. The package includes `src`, `dist`, the README, and license.

The package root now resolves to built ESM instead of `src/index.js`. Existing `window.F5`, UMD filenames, and named exports are retained. Explicit `@fr0st/f5/src/*`, `@fr0st/f5/dist/*`, and `@fr0st/f5/package.json` imports are supported. Other package subpaths are restricted by the export map. Legacy capitalized source directories were removed by the baseline refactor; use the root exports instead of internal paths. Review these path changes when choosing the next release version.

## Releases

CI follows the sibling Frost matrix: Chromium on Node 20, 22, and 24; Firefox and WebKit on Node 24. It runs lint, build, unit/browser tests, coverage upload, bundle freshness checks, and `npm pack --dry-run`.

Publishing a GitHub release triggers the publish workflow, which repeats validation and runs `npm publish --provenance`. Before the first release, configure npm trusted publishing for this repository's `publish.yml` workflow and enable the repository in Codecov. Repository links continue to use the configured `elusivecodes/F5` remote. Set the release version deliberately; tooling alignment alone does not publish a package.

## License

[MIT](LICENSE)
