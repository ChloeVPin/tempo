/**
 * Browser smoke: proves the built ESM bundle runs in a real browser
 * (Chromium). Serves the repo root over a tiny static server and evaluates
 * parse/format/zoned assertions inside the page.
 *
 * Uses the system Chrome (`channel: 'chrome'`) so no browser download is
 * needed locally or on GitHub Actions ubuntu images. Run with:
 *   npm run build && node tests/runtime/browser-smoke.mjs
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const MIME = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.map': 'application/json',
  '.html': 'text/html',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<!doctype html><title>tempo browser smoke</title>');
      return;
    }
    const file = normalize(join(root, pathname));
    if (!file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/`);
  const checks = await page.evaluate(async (origin) => {
    const { Instant, LocalDate, ZonedDateTime } = await import(`${origin}/dist/index.js`);
    const out = [];
    out.push(LocalDate.parse('2026-06-01').plus({ days: 1 }).toISO() === '2026-06-02');
    const z = Instant.parse('2026-06-01T16:00:00Z').toZonedDateTime('America/New_York');
    out.push(z.toLocalDateTime().toISO() === '2026-06-01T12:00:00');
    out.push(z.toISO().includes('-04:00'));
    out.push(ZonedDateTime.parse(z.toISO()).equals(z));
    return out;
  }, `http://127.0.0.1:${port}`);
  if (!checks.every(Boolean)) {
    throw new Error(`browser smoke failed: ${JSON.stringify(checks)}`);
  }
  console.log('browser smoke ok:', JSON.stringify(checks));
} finally {
  await browser.close();
  server.close();
}
