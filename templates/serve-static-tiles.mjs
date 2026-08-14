#!/usr/bin/env node
/**
 * Sawah Static Tile Server
 * A simple, dependency-free Node.js script to serve pre-generated PBF
 * vector tiles from a local directory.
 *
 * It adds the necessary CORS headers so that a MapLibre page can stream
 * the tiles, even when running from a file:// URL.
 *
 * Usage:
 *   node scripts/serve-static-tiles.mjs [--port 8080] [--dir ./tiles]
 *
 * The --dir parameter should point to the root of the generated tiles,
 * which contains the {z}/{x}/{y}.pbf directory structure.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const next = arr[i + 1];
        acc[key] = !next || next.startsWith('--') ? true : next;
    }
    return acc;
}, {});

const PORT = parseInt(args.port || '8080', 10);
const TILE_ROOT = args.dir ? path.resolve(args.dir) : path.resolve(__dirname, '..', 'tiles');

const MIME_TYPES = {
    '.pbf': 'application/x-protobuf',
    '.mvt': 'application/x-protobuf',
};

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=604800');

    const urlMatch = req.url.match(/^\/tiles\/(\d+)\/(\d+)\/(\d+)(\.\w+)$/);
    if (!urlMatch) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Not Found. Request tiles at /tiles/{z}/{x}/{y}.pbf');
    }

    const [, z, x, y, ext] = urlMatch;
    const filePath = path.join(TILE_ROOT, z, x, `${y}${ext}`);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Tile not found');
        }
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Sawah static tile server running on http://localhost:${PORT}`);
    console.log(`Serving tiles from: ${TILE_ROOT}`);
});