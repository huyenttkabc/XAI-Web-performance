// Pilot end-to-end: lập kế hoạch → đo, lưu raw (Lighthouse) → parse → mỗi phép đo một dòng dataset.
// Cách dùng: npm run pilot [-- --scope=real|testbed] [-- --seed=42]   (mặc định: cả hai, seed 42)
// CSV ở đây chỉ chứa batch hiện tại; `npm run reparse` dựng lại toàn bộ dataset (kèm luật V4) từ mọi raw artifact.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startTestbed } from './testbed/testbed-server.js';
import { collectMeasurement } from './collector/lighthouse-collector.js';
import { parseMeasurement } from './parser/lighthouse-report-parser.js';
import { ALL_COLUMNS } from './parser/feature-definitions.js';
import { writeCsv } from './parser/csv-io.js';
import { buildPilotPlan } from './pilot-plan-builder.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = path.join(ROOT, 'data/raw');
const OUT_DIR = path.join(ROOT, 'data/processed');
const argValue = (name, fallback) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const scope = argValue('scope', 'all');
const seed = Number(argValue('seed', 42));

const manifest = JSON.parse(await readFile(path.join(ROOT, 'config/experiment-manifest.json'), 'utf8'));
const batchId = new Date().toISOString();
const testbed = await startTestbed();
const plan = await buildPilotPlan({
  manifest, sitesCsv: path.join(ROOT, 'config/pilot-sites.csv'), testbedBaseUrl: testbed.baseUrl, batchId, scope, seed,
});
console.log(`pilot ${batchId}: ${plan.length} measurements (scope=${scope}, seed=${seed})`);

const rows = [];
async function saveOutputs() {
  await mkdir(OUT_DIR, { recursive: true });
  await writeCsv(path.join(OUT_DIR, 'pilot-batch-latest.csv'), ALL_COLUMNS.map((c) => c.name), rows);
  await writeFile(path.join(OUT_DIR, 'pilot-run-log.json'), JSON.stringify({
    batch_id: batchId, scope, seed, planned: plan.length, measured: rows.length, ok: rows.filter((r) => r.status === 'ok').length,
  }, null, 2));
}

try {
  for (const item of plan) {
    const context = { ...item, raw_path: path.relative(ROOT, path.join(RAW_DIR, item.measurement_id)) };
    let row;
    try {
      const { lhr, trace } = await collectMeasurement({ url: item.url, measurementId: item.measurement_id, rawDir: RAW_DIR, context });
      row = parseMeasurement(lhr, context, trace);
    } catch (error) {
      row = { ...parseMeasurement(null, context), error_message: error.message };
    }
    rows.push(row);
    console.log(`[${item.order_index}/${plan.length}] ${row.status} ${item.site}/${item.page_type} ${item.fault_id}:${item.fault_dose} run=${item.run} LCP=${Math.round(row.lh_lcp_ms ?? NaN)} TBT30=${Math.round(row.tbt_30s_ms ?? NaN)} ${row.quality_flags ?? ''}`);
  }
} finally {
  testbed.close();
  await saveOutputs(); // vẫn giữ kết quả dở dang nếu crash hoặc Ctrl-C giữa chừng
}
console.log(`wrote ${rows.length} rows → data/processed/pilot-batch-latest.csv`);
