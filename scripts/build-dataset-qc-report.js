// Báo cáo QC dataset (W3, Gate G3) → docs/dataset-qc-report.md và bản chụp đóng băng data/processed/dataset-<version>.csv
// Cách dùng: node scripts/build-dataset-qc-report.js [--version=v0.3.1]
//  (1) tái lập: dựng lại độc lập từ raw phải giống TỪNG BYTE với pilot-dataset.csv (do reparse ghi)
//  (2) schema: header trùng feature-definitions.js
//  (3) tiến độ so với kế hoạch  (4) trạng thái / lý do loại  (5) nhật ký lỗi collector
//  (6) giá trị thiếu  (7) lần đo lệch bất thường trong cùng trang  (8) nhiễu giữa các lần lặp trên trang thật
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCsv, parseCsv } from '../src/parser/csv-io.js';
import { rebuildDatasetRows, datasetCsvText, DATASET_COLUMNS } from '../src/parser/rebuild-dataset-from-raw.js';
import { FEATURE_COLUMNS, TARGET_COLUMNS } from '../src/parser/feature-definitions.js';
import { toNumber, median, cv, fmt, groupBy } from '../src/analysis/descriptive-statistics.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = process.argv.find((a) => a.startsWith('--version='))?.split('=')[1] ?? 'v0.3.1';
const DATASET = path.join(ROOT, 'data/processed/pilot-dataset.csv');
const OUTLIER_RATIO = 0.5; // lần đo lệch > 50% so với median của trang thì bị đánh dấu (không xóa)
const manifest = JSON.parse(await readFile(path.join(ROOT, 'config/experiment-manifest.json'), 'utf8'));
const sha = (text) => createHash('sha256').update(text).digest('hex');
const pct = (part, whole) => (whole ? `${((100 * part) / whole).toFixed(1)}%` : '–');
const table = (header, rows) => [`| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)];

// (1)+(2) reproducibility and schema --------------------------------------------------------------
const rawDir = path.join(ROOT, 'data/raw');
const rebuilt = datasetCsvText((await rebuildDatasetRows(rawDir, manifest.measurement_profile.id)).rows);
const onDisk = await readFile(DATASET, 'utf8');
const header = onDisk.split('\n', 1)[0].split(',');
const rows = parseCsv(onDisk);
const reproducible = rebuilt === onDisk && JSON.stringify(header) === JSON.stringify(DATASET_COLUMNS);
// Chỉ chụp snapshot khi Gate G3 đạt: dataset không dựng lại được từ raw thì không bao giờ được đánh version.
// Một version đã ghi là đóng băng: dataset khác phải dùng --version mới (không bao giờ ghi đè).
const snapshotPath = path.join(ROOT, `data/processed/dataset-${VERSION}.csv`);
const existing = await readFile(snapshotPath, 'utf8').catch(() => null);
if (existing !== null && existing !== onDisk) throw new Error(`dataset-${VERSION}.csv is frozen and differs from the current dataset — use a new --version`);
if (reproducible && existing === null) await writeFile(snapshotPath, onDisk, 'utf8');

const lines = [
  `# Dataset QC report — dataset ${VERSION}`, '',
  '> Sinh tự động bởi `node scripts/build-dataset-qc-report.js`. Không sửa tay.',
  `> Snapshot: ${reproducible ? `\`data/processed/dataset-${VERSION}.csv\`` : '**không ghi — Gate G3 chưa đạt**'} · ${rows.length} dòng × ${header.length} cột · sha256 \`${sha(onDisk).slice(0, 16)}…\``, '',
  '## 1. Gate G3 — schema ổn định, parser tái lập', '',
  ...table(['Kiểm tra', 'Kết quả'], [
    ['Header = `feature-definitions.js` (thứ tự và tên cột)', JSON.stringify(header) === JSON.stringify(DATASET_COLUMNS) ? '✅' : '❌'],
    ['Dựng lại độc lập từ raw = file `pilot-dataset.csv` do `npm run reparse` ghi (byte)', rebuilt === onDisk ? '✅' : '❌ chạy `npm run reparse`'],
    ['`measurement_id` duy nhất', new Set(rows.map((r) => r.measurement_id)).size === rows.length ? '✅' : '❌'],
  ]), '',
];

// (3) coverage of the main-study plan -----------------------------------------------------------
const plan = await readCsv(path.join(ROOT, 'config/main-study-sites.csv'));
const real = rows.filter((r) => r.site_type === 'shopify_storefront');
const runsPerPage = manifest.runs.real_site;
const planned = plan.length * runsPerPage;
const inPlan = (r) => plan.some((p) => p.site === r.site && p.page_type === r.page_type);
// một dòng cho mỗi (site, trang, run): trang được đo lại ở batch sau không được tính hai lần vào kế hoạch
const measuredReal = [...groupBy(real.filter(inPlan), (r) => `${r.site}|${r.page_type}|${r.run}`).values()].map((group) => group.at(-1));
lines.push('## 2. Tiến độ thu thập (Shopify thật)', '',
  `Kế hoạch: ${new Set(plan.map((p) => p.site)).size} store × 2 trang × ${runsPerPage} lần = **${planned} phép đo**. Đã đo **${measuredReal.length}** (${pct(measuredReal.length, planned)}), hợp lệ ${measuredReal.filter((r) => r.status === 'ok').length}.`, '',
  ...table(['wave', 'stratum', 'store', 'đã đo / kế hoạch', 'ok'], [...groupBy(plan, (p) => `${p.wave}|${p.stratum}`)].sort().map(([key, pages]) => {
    const [wave, stratum] = key.split('|');
    const measured = measuredReal.filter((r) => pages.some((p) => p.site === r.site && p.page_type === r.page_type));
    return [wave, stratum, new Set(pages.map((p) => p.site)).size, `${measured.length} / ${pages.length * runsPerPage}`, measured.filter((r) => r.status === 'ok').length];
  })), '');

// (4) status and validity reasons ----------------------------------------------------------------
const reasons = (r) => (r.quality_flags || '').split(';').filter((f) => f && !f.includes(':') && f !== 'load_timeout');
lines.push('## 3. Trạng thái và lý do loại', '',
  ...table(['site_type', 'ok', 'invalid', 'error', 'lý do invalid (V1–V4)'], [...groupBy(rows, (r) => r.site_type)].map(([type, group]) => {
    const counts = groupBy(group.filter((r) => r.status === 'invalid').flatMap(reasons), (x) => x);
    return [type, ...['ok', 'invalid', 'error'].map((s) => group.filter((r) => r.status === s).length), [...counts].map(([k, v]) => `${k} ×${v.length}`).join(', ') || '–'];
  })), '');

// (5) collector error log -------------------------------------------------------------------------
const logText = await readFile(path.join(ROOT, 'data/logs/collector-error-log.jsonl'), 'utf8').catch(() => '');
const logEntries = logText.split('\n').filter(Boolean).map((l) => JSON.parse(l));
lines.push('## 4. Nhật ký lỗi collector (`data/logs/collector-error-log.jsonl`)', '',
  `${logEntries.length} phép đo không ok được ghi (V1–V3 lúc đo và lỗi không có report; V4 chỉ áp lúc reparse).`, '',
  ...(logEntries.length ? table(['status', 'cờ / lỗi', 'số lần', 'site'], [...groupBy(logEntries, (e) => `${e.status}|${e.error_message ? e.error_message.split(':')[0] : e.quality_flags.split(';')[0]}`)]
    .map(([key, group]) => [...key.split('|'), group.length, [...new Set(group.map((e) => e.site))].join(', ')])) : []), '');

// (6) missing values ------------------------------------------------------------------------------
const ok = rows.filter((r) => r.status === 'ok');
const okReal = ok.filter((r) => r.site_type === 'shopify_storefront');
const missingRows = [...TARGET_COLUMNS, ...FEATURE_COLUMNS].map((c) => {
  const miss = (subset) => subset.filter((r) => !Number.isFinite(toNumber(r[c.name]))).length;
  return [`\`${c.name}\``, c.family ?? 'target', pct(miss(okReal), okReal.length), pct(miss(ok.filter((r) => r.site_type !== 'shopify_storefront')), ok.length - okReal.length)];
}).filter((r) => r[2] !== '0.0%' || r[3] !== '0.0%');
lines.push('## 5. Giá trị thiếu (dòng ok)', '', missingRows.length ? 'Chỉ liệt kê cột có thiếu; mọi cột khác đầy đủ 100%.' : 'Không cột nào thiếu.', '',
  ...(missingRows.length ? table(['cột', 'nhóm', 'thiếu — site thật', 'thiếu — testbed'], missingRows) : []), '',
  '`lh_tbt_ms` thiếu khi trang không đạt TTI (dự kiến, xem protocol §5); target chính `tbt_30s_ms` không phụ thuộc TTI.', '');

// (7) outliers and (8) noise per real page --------------------------------------------------------
const pages = [...groupBy(okReal, (r) => `${r.site}|${r.page_type}`)];
let checkedValues = 0; // trang có median gần 0 (vd TBT ≈ 0) không có độ lệch tương đối có nghĩa
const outliers = pages.flatMap(([key, group]) => ['lh_lcp_ms', 'tbt_30s_ms'].flatMap((name) => {
  const m = median(group.map((r) => toNumber(r[name])));
  if (!(m >= 50)) return [];
  checkedValues += group.length;
  return group.filter((r) => Math.abs(toNumber(r[name]) / m - 1) > OUTLIER_RATIO)
    .map((r) => [key.replace('|', ' / '), name, r.run, fmt(toNumber(r[name])), fmt(m)]);
}));
lines.push('## 6. Lần đo lệch bất thường (outlier)', '',
  `Quy tắc: lệch > ${OUTLIER_RATIO * 100}% so với median của chính trang đó (cùng store, cùng loại trang). Chỉ **đánh dấu để xem lại**, không loại — dao động lớn là đặc tính thật của site thật và đã được tính vào nhiễu.`, '',
  `${outliers.length} / ${checkedValues} giá trị được kiểm tra bị đánh dấu (bỏ qua trang có median < 50 ms).`, '',
  ...(outliers.length ? table(['trang', 'target', 'run', 'giá trị', 'median trang'], outliers) : []), '');

const cvs = (name) => pages.map(([, group]) => cv(group.map((r) => toNumber(r[name])))).filter(Number.isFinite);
lines.push('## 7. Nhiễu giữa các lần lặp (site thật)', '',
  ...table(['target', 'số trang', 'CV trung vị', 'CV p90', 'CV max'], ['lh_lcp_ms', 'tbt_30s_ms', 'lh_fcp_ms'].map((name) => {
    const values = cvs(name).sort((a, b) => a - b);
    const q = (p) => pct(values[Math.min(values.length - 1, Math.floor(p * values.length))] ?? NaN, 1);
    if (!values.length) return [`\`${name}\``, 0, '–', '–', '–'];
    return [`\`${name}\``, values.length, pct(median(values), 1), q(0.9), q(1)];
  })), '');

await writeFile(path.join(ROOT, 'docs/dataset-qc-report.md'), `${lines.join('\n')}\n`);
console.log(`docs/dataset-qc-report.md written · dataset ${VERSION}: ${rows.length} rows · reproducible=${reproducible}`);
