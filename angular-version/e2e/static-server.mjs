// Serves the production build (both languages) for the end-to-end tests,
// the same way GitHub Pages does: /en-US/... and /it/..., each falling back
// to its own index.html.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'dist', 'intelligent-family-calendar-angular', 'browser');
const PORT = Number(process.env.PORT ?? 4300);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.svg': 'image/svg+xml'
};

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  const locale = path.split(/[\\/]/)[1] || 'en-US';
  try {
    const file = extname(path) ? join(ROOT, path) : join(ROOT, locale, 'index.html');
    if (!file.startsWith(ROOT)) throw new Error('outside root');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => console.log(`Serving ${ROOT} on http://127.0.0.1:${PORT}`));
