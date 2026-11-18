// Kiểm tra mọi batch site thật đều đo bằng CÙNG một cấu hình Lighthouse (protocol §10, 09/10/2026 (2):
// đo bù chỉ được gộp khi configSettings trùng khớp). Exit code 1 khi các batch khác nhau.
// Cách dùng: node scripts/check-measurement-config-consistency.js
import { readdir, readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = path.join(ROOT, 'data/raw');

/** Các thiết lập định nghĩa một phép đo: thiết bị, throttling, cửa sổ tải, phiên bản Lighthouse và Chrome. */
function configKey(lhr) {
  const c = lhr.configSettings ?? {};
  return JSON.stringify({
    formFactor: c.formFactor, throttlingMethod: c.throttlingMethod, throttling: c.throttling,
    screenEmulation: c.screenEmulation, userAgent: c.emulatedUserAgent, maxWaitForLoad: c.maxWaitForLoad,
    lighthouse: lhr.lighthouseVersion, chrome: lhr.environment?.hostUserAgent?.match(/Chrome\/[\d.]+/)?.[0],
  });
}

const batchesByConfig = new Map();
for (const id of await readdir(RAW_DIR)) {
  try {
    const context = JSON.parse(await readFile(path.join(RAW_DIR, id, 'context.json'), 'utf8'));
    if (context.site_type !== 'shopify_storefront') continue;
    const lhr = JSON.parse(gunzipSync(await readFile(path.join(RAW_DIR, id, 'lhr.json.gz'))));
    const key = configKey(lhr);
    if (!batchesByConfig.has(key)) batchesByConfig.set(key, new Map());
    const batches = batchesByConfig.get(key);
    batches.set(context.batch_id, (batches.get(context.batch_id) ?? 0) + 1);
  } catch { /* không có report (lần đo lỗi) — không có gì để so */ }
}

for (const [key, batches] of batchesByConfig) {
  console.log(`config ${key}`);
  for (const [batch, n] of [...batches].sort()) console.log(`  batch ${batch}: ${n} reports`);
}
const consistent = batchesByConfig.size === 1;
console.log(consistent ? 'OK: all real-site batches share one configuration' : `MISMATCH: ${batchesByConfig.size} configurations`);
process.exit(consistent ? 0 : 1);
