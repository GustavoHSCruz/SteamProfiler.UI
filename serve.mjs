#!/usr/bin/env node
// Serve the gallery and its public assets, without exposing the checkout.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const port = Number(process.env.PORT ?? 5190);
const host = process.env.HOST ?? '0.0.0.0';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2' };

const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  if (path === '/') path = '/index.html';
  if (path !== '/index.html' && !/^\/(?:css|fonts|dist)\/[a-zA-Z0-9_-]+\.(?:css|woff2)$/.test(path)) {
    res.writeHead(404).end();
    return;
  }
  try {
    const data = await readFile(new URL(`.${path}`, import.meta.url));
    res.writeHead(200, {
      'Content-Type': types[extname(path)],
      'Content-Length': data.length,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
  }
});
server.on('error', (error) => { console.error(error.message); process.exit(1); });
server.listen(port, host, () => console.log(`SteamProfiler.UI listening on http://${host}:${port}`));
