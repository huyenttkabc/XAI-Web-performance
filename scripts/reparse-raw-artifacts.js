// Dựng lại data/processed/pilot-dataset.csv từ data/raw/*/ (context.json + lhr.json.gz)
// mà KHÔNG đo lại — dùng sau khi thêm hoặc sửa feature trong src/parser/.
import { readdir, readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMeasurement } from '../src/parser/lighthouse-report-parser.js';
import { ALL_COLUMNS } from '../src/parser/feature-definitions.js';
import { writeCsv } from '../src/parser/csv-io.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = path.join(ROOT, 'data/raw');
const OUT_CSV = path.join(ROOT, 'data/processed/pilot-dataset.csv');

const rows = [];
for (const id of (await readdir(RAW_DIR)).sort()) {
  try {
    const context = JSON.parse(await readFile(path.join(RAW_DIR, id, 'context.json'), 'utf8'));
    const lhr = await readFile(path.join(RAW_DIR, id, 'lhr.json.gz')).then((buf) => JSON.parse(gunzipSync(buf)), () => null);
    rows.push(parseMeasurement(lhr, context)); // không có report → dòng status=error, error_message lấy từ context
  } catch (error) {
    console.warn(`skip ${id}: ${error.message}`);
  }
}
// Sắp theo batch rồi thứ tự đo ⇒ file đầu ra ổn định, diff git dễ đọc.
rows.sort((a, b) => `${a.batch_id}${a.order_index ?? ''}${a.collected_at}`.localeCompare(`${b.batch_id}${b.order_index ?? ''}${b.collected_at}`));
await writeCsv(OUT_CSV, ALL_COLUMNS.map((c) => c.name), rows);
console.log(`re-parsed ${rows.length} measurements → ${path.relative(ROOT, OUT_CSV)}`);
