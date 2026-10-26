import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 4173);
const rootDir = fileURLToPath(new URL('../../../', import.meta.url));

const routes = new Map([
    [
        '/',
        fileURLToPath(new URL('../app/index.html', import.meta.url)),
    ],
    [
        '/source',
        fileURLToPath(new URL('../app/source.html', import.meta.url)),
    ],
]);

const staticRoots = [
    {
        prefix: '/demo/',
        root: path.join(rootDir, 'demo'),
    },
    {
        prefix: '/dist/',
        root: path.join(rootDir, 'dist'),
    },
    {
        prefix: '/src/',
        root: path.join(rootDir, 'src'),
    },
];

function getContentType(filePath) {
    switch (path.extname(filePath)) {
        case '.html':
            return 'text/html; charset=utf-8';
        case '.css':
            return 'text/css; charset=utf-8';
        case '.js':
            return 'text/javascript; charset=utf-8';
        case '.map':
            return 'application/json; charset=utf-8';
        default:
            return 'application/octet-stream';
    }
}

function send(response, status, body, headers = {}) {
    response.writeHead(status, headers);
    response.end(body);
}

function resolveStaticPath(pathname) {
    for (const { prefix, root } of staticRoots) {
        if (!pathname.startsWith(prefix)) {
            continue;
        }

        const relativePath = pathname.slice(prefix.length);
        const filePath = path.resolve(root, relativePath);

        if (
            filePath !== root &&
            !filePath.startsWith(`${root}${path.sep}`)
        ) {
            return null;
        }

        return filePath;
    }

    return routes.get(pathname) ?? null;
}

const server = createServer(async (request, response) => {
    let pathname;

    try {
        pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    } catch {
        send(response, 400, 'Bad request');

        return;
    }

    const filePath = resolveStaticPath(pathname);

    if (!filePath) {
        send(response, 404, 'Not found');

        return;
    }

    try {
        const file = await readFile(filePath);

        send(response, 200, file, {
            'Cache-Control': 'no-store',
            'Content-Type': getContentType(filePath),
        });
    } catch (error) {
        send(response, error.code === 'ENOENT' ? 404 : 500, 'Unable to read file');
    }
});

function shutdown() {
    server.close(() => {
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(port, '127.0.0.1');
