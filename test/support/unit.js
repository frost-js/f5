/* eslint no-empty-pattern: ["error", { "allowObjectPatternsAsParameters": true }] -- Playwright requires destructured fixture parameters. */
import { test as base, expect } from '@playwright/test';
import { createCanvasNode, createRecordingContext } from './canvas.js';
import { createHitTestContext, createPath2DStub, createPathRenderEnvironment, createShapeRenderEnvironment } from './path.js';
import { createAnimationWindow, stubGlobal } from './runtime.js';

export { expect };

export const test = base.extend({
    animationWindow: async ({}, use) => {
        await use(createAnimationWindow());
    },
    canvasNode: async ({}, use) => {
        await use((context, extra) => createCanvasNode(context, extra));
    },
    hitTestContext: async ({}, use) => {
        await use((result) => createHitTestContext(result));
    },
    path2D: [async ({}, use) => {
        const Path2DStub = createPath2DStub();
        const restorePath2D = stubGlobal('Path2D', Path2DStub);

        try {
            await use(Path2DStub);
        } finally {
            restorePath2D();
        }
    }, {
        auto: true,
    }],
    pathRenderEnvironment: async ({}, use) => {
        const environment = createPathRenderEnvironment();
        const restoreDocument = stubGlobal('document', environment.document);

        try {
            await use(environment);
        } finally {
            restoreDocument();
        }
    },
    recordingContext: async ({}, use) => {
        await use(createRecordingContext());
    },
    shapeRenderEnvironment: async ({}, use) => {
        const environment = createShapeRenderEnvironment();
        const restoreDocument = stubGlobal('document', environment.document);

        try {
            await use(environment);
        } finally {
            restoreDocument();
        }
    },
});
