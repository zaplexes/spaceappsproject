import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

// Serve runtime files from disk: Vite's public-file index can become stale when
// another install/build regenerates the ignored Cesium directory during dev.
export function cesiumRuntimePlugin(base: string): Plugin {
  return {
    name: 'cesium-runtime-assets',
    configureServer(server) {
      const root = resolve(server.config.publicDir, 'cesium');
      const prefix = `${base}cesium/`;
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split('?')[0] ?? '';
        if (!pathname.startsWith(prefix)) return next();
        let file: string;
        try {
          file = resolve(
            root,
            decodeURIComponent(pathname.slice(prefix.length)),
          );
        } catch {
          response.writeHead(400).end();
          return;
        }
        if (!file.startsWith(`${root}${sep}`)) {
          response.writeHead(404).end();
          return;
        }
        void stat(file).then(
          (info) => {
            if (!info.isFile()) {
              response.writeHead(404).end();
              return;
            }
            const types: Record<string, string> = {
              '.js': 'text/javascript',
              '.json': 'application/json',
              '.wasm': 'application/wasm',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.svg': 'image/svg+xml',
              '.gif': 'image/gif',
              '.css': 'text/css',
            };
            response.setHeader(
              'Content-Type',
              types[extname(file)] ?? 'application/octet-stream',
            );
            response.setHeader('Content-Length', info.size);
            response.setHeader('Cache-Control', 'no-cache');
            if (request.method === 'HEAD') {
              response.end();
              return;
            }
            createReadStream(file).on('error', next).pipe(response);
          },
          () => {
            // A missing module must never be returned as the SPA's HTML document.
            response.writeHead(404).end();
          },
        );
      });
    },
  };
}
