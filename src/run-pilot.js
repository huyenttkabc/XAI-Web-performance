// Một đợt thu thập end-to-end: lập kế hoạch → đo, lưu raw (Lighthouse) → parse → mỗi phép đo một dòng dataset.
// Cách dùng: npm run pilot [-- --scope=real|testbed] [-- --seed=42] [-- --sites=config/x.csv] [-- --wave=1]
//   mặc định: cả hai scope, seed 42, config/pilot-sites.csv, mọi wave. Nghiên cứu chính: npm run collect:wave1
// Mỗi phép đo không ok (V1–V3 hoặc không có report) được ghi thêm vào data/logs/collector-error-log.jsonl.
// Mỗi phép đo chạy trong tiến trình con riêng (collector/collect-one-measurement-process.js) để giải phóng bộ nhớ.
// Đo tiếp batch bị ngắt: cùng tùy chọn + --resume=<batch_id> → cùng id, cùng thứ tự; phép đo đã có report được bỏ qua.
// CSV ở đây chỉ chứa batch hiện tại; `npm run reparse` dựng lại toàn bộ dataset (kèm luật V4) từ mọi raw artifact.
import { readFile, writeFile, mkdir, appendFile, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startTestbed } from './testbed/testbed-server.js';
import { parseMeasurement } from './parser/lighthouse-report-parser.js';
import { parseRawMeasurement } from './parser/rebuild-dataset-from-raw.js';
import { ALL_COLUMNS } from './parser/feature-definitions.js';
import { writeCsv } from './parser/csv-io.js';
import { buildPilotPlan } from './pilot-plan-builder.js';
import { MEASUREMENT_TIMEOUT_MS } from './collector/lighthouse-collector.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = path.join(ROOT, 'data/raw');
const OUT_DIR = path.join(ROOT, 'data/processed');
const ERROR_LOG = path.join(ROOT, 'data/logs/collector-error-log.jsonl');
const CHILD = path.join(ROOT, 'src/collector/collect-one-measurement-process.js');
const CHILD_TIMEOUT_MS = MEASUREMENT_TIMEOUT_MS + 90_000; // > chốt chặn của chính collector; chỉ cho con bị treo
const run = promisify(execFile);
const exists = (file) => access(file).then(() => true, () => false);
const argValue = (name, fallback) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const scope = argValue('scope', 'all');
const seed = Number(argValue('seed', 42));
const sitesCsv = path.resolve(ROOT, argValue('sites', 'config/pilot-sites.csv'));
const waveArg = argValue('wave', undefined);
const wave = waveArg === undefined ? undefined : Number(waveArg);

const manifest = JSON.parse(await readFile(path.join(ROOT, 'config/experiment-manifest.json'), 'utf8'));
const batchId = argValue('resume', new Date().toISOString());
const testbed = await startTestbed();
const plan = await buildPilotPlan({ manifest, sitesCsv, testbedBaseUrl: testbed.baseUrl, batchId, scope, seed, wave });
console.log(`batch ${batchId}: ${plan.length} measurements (scope=${scope}, seed=${seed}, sites=${path.relative(ROOT, sitesCsv)}, wave=${wave ?? 'all'})`);
await mkdir(path.dirname(ERROR_LOG), { recursive: true });

/** Nhật ký lỗi collector: một dòng JSON cho mỗi phép đo không ok, giữ qua mọi batch. */
async function logProblem(item, row) {
  if (row.status === 'ok') return;
  const entry = { logged_at: new Date().toISOString(), batch_id: batchId, measurement_id: item.measurement_id, site: item.site, page_type: item.page_type,
    url: item.url, run: item.run, fault_id: item.fault_id, status: row.status, quality_flags: row.quality_flags ?? '', error_message: row.error_message ?? '' };
  await appendFile(ERROR_LOG, `${JSON.stringify(entry)}\n`);
}

const rows = [];
async function saveOutputs() {
  await mkdir(OUT_DIR, { recursive: true });
  await writeCsv(path.join(OUT_DIR, 'pilot-batch-latest.csv'), ALL_COLUMNS.map((c) => c.name), rows);
  await writeFile(path.join(OUT_DIR, 'pilot-run-log.json'), JSON.stringify({
    batch_id: batchId, scope, seed, sites: path.relative(ROOT, sitesCsv), wave: wave ?? 'all', planned: plan.length, measured: rows.length, ok: rows.filter((r) => r.status === 'ok').length,
  }, null, 2));
}

try {
  for (const item of plan) {
    const context = { ...item, raw_path: path.relative(ROOT, path.join(RAW_DIR, item.measurement_id)) };
    const measurementDir = path.join(RAW_DIR, item.measurement_id);
    if (await exists(path.join(measurementDir, 'lhr.json.gz'))) { console.log(`[${item.order_index}/${plan.length}] skip (already collected)`); continue; }
    let row;
    try {
      const job = { url: item.url, measurementId: item.measurement_id, rawDir: RAW_DIR, context };
      const childError = await run(process.execPath, [CHILD, JSON.stringify(job)], { timeout: CHILD_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 }).then(() => null, (e) => e);
      row = await parseRawMeasurement(measurementDir); // không có report → dòng error (lỗi lấy từ context.json)
      if (row.status === 'error' && !row.error_message) {
        row.error_message = `collector process failed without a report (${childError?.signal ?? `exit ${childError?.code}`}): ${String(childError?.stderr ?? '').trim().slice(0, 200)}`;
      }
    } catch (error) {
      row = { ...parseMeasurement(null, context), error_message: error.message };
    }
    rows.push(row);
    await logProblem(item, row);
    console.log(`[${item.order_index}/${plan.length}] ${row.status} ${item.site}/${item.page_type} ${item.fault_id}:${item.fault_dose} run=${item.run} LCP=${Math.round(row.lh_lcp_ms ?? NaN)} TBT30=${Math.round(row.tbt_30s_ms ?? NaN)} ${row.quality_flags ?? ''}`);
  }
} finally {
  testbed.close();
  await saveOutputs(); // vẫn giữ kết quả dở dang nếu crash hoặc Ctrl-C giữa chừng
}
console.log(`wrote ${rows.length} rows → data/processed/pilot-batch-latest.csv`);
