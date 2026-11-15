// Testbed có kiểm soát: phục vụ một cửa hàng mini tĩnh và chèn script lỗi (fault) khi URL yêu cầu,
// ví dụ /home.html?fault=js-long-task&dose=250&count=4 (dose=0 là baseline).
// Mọi thứ khác giống hệt nhau giữa các điều kiện ⇒ fault là nguyên nhân DUY NHẤT của thay đổi.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'site');
const DEFAULT_PORT = 4173;
const KNOWN_FAULTS = new Set(['js-long-task']);
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

/** Ép giá trị nguyên vào khoảng [min, max]; giá trị rác → fallback. */
function clampInt(raw, fallback, min, max) {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) ? Math.min(Math.max(value, min), max) : fallback;
}

/**
 * Đọc tham số fault từ query string; trả null nếu không có fault hợp lệ.
 * Giữ dose = 0 (không trả null): baseline vẫn tải script fault nhưng script không làm gì,
 * nên baseline và fault chỉ khác nhau ở công việc main thread — không khác request hay bytes.
 */
export function parseFault(searchParams) {
  const id = searchParams.get('fault');
  if (!id || !KNOWN_FAULTS.has(id)) return null;
  return {
    id,
    dose: clampInt(searchParams.get('dose'), 0, 0, 5000),
    count: clampInt(searchParams.get('count'), 1, 1, 50),
  };
}

/** Chèn thẻ <script> của fault ngay trước </body>. */
export function injectFault(html, fault) {
  if (!fault) return html;
  const tag = `<script src="/faults/${fault.id}.js" data-dose="${fault.dose}" data-count="${fault.count}"></script>`;
  return html.replace('</body>', `  ${tag}\n</body>`);
}

async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, 'http://testbed');
    const pathname = url.pathname === '/' ? '/home.html' : url.pathname;
    const filePath = path.normalize(path.join(SITE_DIR, pathname));
    // Chặn path traversal (vd: /../../etc/passwd) — chỉ được đọc file bên trong SITE_DIR.
    if (!filePath.startsWith(SITE_DIR + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const ext = path.extname(filePath);
    let body = await readFile(filePath, 'utf8'); // asset của testbed đều là text
    if (ext === '.html') body = injectFault(body, parseFault(url.searchParams));
    res.writeHead(200, {
      'content-type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
      'cache-control': 'no-store', // không cho cache ⇒ mọi lần đo đều tải lại như nhau
    });
    res.end(body);
  } catch (error) {
    res.writeHead(['ENOENT', 'EISDIR'].includes(error.code) ? 404 : 500).end();
  }
}

/** Khởi động testbed; resolve { server, baseUrl } để collector dùng. */
export function startTestbed(port = DEFAULT_PORT) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest);
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({ server, baseUrl: `http://127.0.0.1:${port}` }));
  });
}

// Chỉ tự chạy server khi gọi trực tiếp `node testbed-server.js` (không chạy khi được import).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { baseUrl } = await startTestbed(Number(process.env.PORT) || DEFAULT_PORT);
  console.log(`testbed listening on ${baseUrl} (try ${baseUrl}/home.html?fault=js-long-task&dose=250&count=4)`);
}
