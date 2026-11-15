// Testbed có kiểm soát: phục vụ cửa hàng mini tất định, trang được dựng cho đúng MỘT điều kiện
// (?fault=<id>&dose=<n>, xem fault-catalog.js; không có fault = baseline), cùng các asset tổng hợp.
// Một listener thứ hai trên host khác (localhost:<port+1>) đóng vai origin "bên thứ ba".
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCondition, renderPage, FAULTS, BASELINE_HERO_KB, THIRD_PARTY_SCRIPT, MAX_THIRD_PARTY_SLOTS } from './fault-catalog.js';
import { heroPng, blockingCss, thirdPartyScript } from './synthetic-asset-generators.js';

const SITE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'site');
const DEFAULT_PORT = 4173;
const MAX_KB = 5000;
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};
const generatedCache = new Map(); // asset sinh ra là tất định → dựng một lần cho mỗi URL

const boundedInt = (value, max) => Math.min(Math.max(parseInt(value ?? '0', 10) || 0, 0), max);

/** Asset tổng hợp được định danh bằng query string; null nếu path không phải asset sinh ra. */
function generatedAsset(url) {
  const kb = boundedInt(url.searchParams.get('kb'), MAX_KB);
  switch (url.pathname) {
    case '/assets/hero.png': return heroPng(kb);
    case '/faults/blocking.css': return blockingCss(kb);
    case '/tp-script.js': return thirdPartyScript(boundedInt(url.searchParams.get('i'), 1000), kb, boundedInt(url.searchParams.get('cpu'), 1000));
    default: return null;
  }
}

/** Dựng sẵn mọi asset của fault matrix để không lần đo nào phải trả thời gian sinh asset. */
function prewarm() {
  const urls = [
    ...[BASELINE_HERO_KB, ...FAULTS['lcp-heavy-image'].severities].map((kb) => `/assets/hero.png?kb=${kb}`),
    ...[0, ...FAULTS['render-blocking-css'].severities].map((kb) => `/faults/blocking.css?kb=${kb}`),
    ...Array.from({ length: MAX_THIRD_PARTY_SLOTS }, (_, i) =>
      `/tp-script.js?i=${String(i).padStart(2, '0')}&kb=${THIRD_PARTY_SCRIPT.kb}&cpu=${THIRD_PARTY_SCRIPT.cpuMs}`),
  ];
  for (const href of urls) {
    const url = new URL(href, 'http://testbed');
    generatedCache.set(`${url.pathname}?${url.searchParams}`, generatedAsset(url));
  }
}

function send(res, ext, body) {
  res.writeHead(200, { 'content-type': CONTENT_TYPES[ext] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(body);
}

function createHandler(thirdPartyOrigin) {
  return async (req, res) => {
    try {
      const url = new URL(req.url, 'http://testbed');
      const pathname = url.pathname === '/' ? '/home.html' : url.pathname;
      const ext = path.extname(pathname);
      const cacheKey = `${pathname}?${url.searchParams}`;
      if (!generatedCache.has(cacheKey)) {
        const asset = generatedAsset(url);
        if (asset !== null) generatedCache.set(cacheKey, asset);
      }
      if (generatedCache.has(cacheKey)) return send(res, ext, generatedCache.get(cacheKey));

      const filePath = path.normalize(path.join(SITE_DIR, pathname));
      if (!filePath.startsWith(SITE_DIR + path.sep)) return res.writeHead(403).end(); // chặn path traversal
      const body = await readFile(filePath, 'utf8'); // file tĩnh của testbed đều là text
      return send(res, ext, ext === '.html' ? renderPage(body, parseCondition(url.searchParams), thirdPartyOrigin) : body);
    } catch (error) {
      return res.writeHead(['ENOENT', 'EISDIR'].includes(error.code) ? 404 : 500).end();
    }
  };
}

function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
}

/** Mở listener first-party (127.0.0.1:port) và third-party (localhost:port+1). */
export async function startTestbed(port = DEFAULT_PORT) {
  prewarm();
  const thirdPartyOrigin = `http://localhost:${port + 1}`;
  const handler = createHandler(thirdPartyOrigin);
  const firstParty = http.createServer(handler);
  const thirdParty = http.createServer(handler);
  await listen(firstParty, port, '127.0.0.1');
  await listen(thirdParty, port + 1, 'localhost');
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    thirdPartyOrigin,
    close: () => { firstParty.close(); thirdParty.close(); },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { baseUrl } = await startTestbed(Number(process.env.PORT) || DEFAULT_PORT);
  console.log(`testbed on ${baseUrl} — e.g. ${baseUrl}/home.html?fault=lcp-heavy-image&dose=900`);
}
