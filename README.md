# F5

**F5** is a free, open-source canvas library for *JavaScript*.

It takes heavy inspiration from **P5**, focusing on 2D animation in a lightweight package.


## Table Of Contents
- [Installation](#installation)
- [Testing](#testing)
- [Usage](#usage)



## Installation

**JS**

```html
<script type="text/javascript" src="/path/to/f5.min.js"></script>
```

**Using NPM**

```
npm i @fr0st/f5
```

In Node.js:

```javascript
import { Canvas, Vector } from '@fr0st/f5';
```


## Testing

F5 uses Playwright for both fast module-level tests and real browser canvas tests.

```bash
npm test
npm run test:unit
npm run test:browser
npm run test:headed
npm run test:ui
```

The test suite is organized as:

- `test/unit` for pure logic and state-based tests
- `test/browser` for DOM, input, and canvas rendering behavior
- `test/support` for the Playwright harness and shared test utilities

Browser coverage is split into two layers:

- source-module integration tests that load files from `src/`
- bundle smoke tests that load `dist/f5.js`

That keeps browser behavior checks separate from the build artifact check.


## Usage

Check the demo folder for examples. Full documentation and website coming soon™.

`Canvas.update(deltaTime, elapsedTime)` receives frame delta first, then total elapsed time, both in seconds.

`Canvas` also accepts a `runtime` option for custom timing, frame scheduling, and event targets. That is mainly useful for tests and custom embedding environments.
