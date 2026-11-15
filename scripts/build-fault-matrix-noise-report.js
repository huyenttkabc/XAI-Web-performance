// Sinh docs/fault-matrix-noise-report.md từ data/processed/pilot-dataset.csv:
//  (1) fault matrix — tác động của từng fault × mức so với baseline (testbed)
//  (2) manipulation check & liều–đáp ứng — Spearman(mức, đặc trưng cơ chế / outcome chính)
//  (3) nhiễu — biến thiên giữa các lần lặp trên testbed và trên trang Shopify thật
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCsv } from '../src/parser/csv-io.js';
import { FAULTS } from '../src/testbed/fault-catalog.js';
import { toNumber, finite, median, iqr, cv, spearman, fmt, groupBy } from '../src/analysis/descriptive-statistics.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = await readCsv(path.join(ROOT, 'data/processed/pilot-dataset.csv'));
const ok = rows.filter((r) => r.status === 'ok');
const testbed = ok.filter((r) => r.site_type === 'controlled_testbed');
const real = rows.filter((r) => r.site_type === 'shopify_storefront');

const col = (subset, name) => subset.map((r) => toNumber(r[name]));
const medIqr = (subset, name) => `${fmt(median(col(subset, name)))} [${fmt(iqr(col(subset, name)))}]`;
const pct = (value) => (Number.isFinite(value) ? `${(100 * value).toFixed(1)}%` : '–');

const lines = [
  '# Fault matrix & noise report (protocol v1.0 pilot)',
  '',
  '> Sinh tự động bởi `node scripts/build-fault-matrix-noise-report.js`. Không sửa tay.',
  `> Dữ liệu: ${rows.length} phép đo · ok ${ok.length} · invalid ${rows.filter((r) => r.status === 'invalid').length} · error ${rows.filter((r) => r.status === 'error').length}. Ô = median [IQR] (ms).`,
  '',
];

// (1) Fault matrix -------------------------------------------------------------------------------
lines.push('## 1. Fault matrix (testbed) — median [IQR] qua các lần lặp', '');
for (const [page, pageRows] of groupBy(testbed, (r) => r.page_type)) {
  const baseline = pageRows.filter((r) => r.fault_id === 'none');
  const base = (name) => median(col(baseline, name));
  lines.push(`### Trang \`${page}\``, '', '| fault (cause group) | mức | liều | n | LCP | FCP | TBT30 | ΔLCP | ΔFCP | ΔTBT30 |', '|---|---|---|---|---|---|---|---|---|---|');
  const conditions = groupBy(pageRows, (r) => `${r.fault_id}|${r.severity_level}`);
  const ordered = [...conditions.keys()].sort((a, b) => (a.startsWith('none') ? -1 : b.startsWith('none') ? 1 : a.localeCompare(b, 'en', { numeric: true })));
  for (const key of ordered) {
    const group = conditions.get(key);
    const [fault, level] = key.split('|');
    const delta = (name) => (fault === 'none' ? '' : fmt(median(col(group, name)) - base(name)));
    const label = fault === 'none' ? '**baseline**' : `${fault} (${FAULTS[fault].cause_group})`;
    lines.push(`| ${label} | ${level} | ${group[0].fault_dose} | ${group.length} | ${medIqr(group, 'lh_lcp_ms')} | ${medIqr(group, 'lh_fcp_ms')} | ${medIqr(group, 'tbt_30s_ms')} | ${delta('lh_lcp_ms')} | ${delta('lh_fcp_ms')} | ${delta('tbt_30s_ms')} |`);
  }
  lines.push('');
}

// (2) Manipulation check & liều–đáp ứng -----------------------------------------------------------
lines.push('## 2. Manipulation check & dose–response', '',
  'Spearman ρ giữa mức nghiêm trọng (0 = baseline … 3) và (a) đặc trưng cơ chế, (b) outcome chính của fault, gộp hai trang. ρ ≈ 1 = tăng đơn điệu theo liều.', '',
  '| fault | cause group | đặc trưng cơ chế | ρ(mức, đặc trưng) | outcome chính | ρ(mức, outcome) | median outcome theo mức 0→3 |', '|---|---|---|---|---|---|---|');
for (const [id, fault] of Object.entries(FAULTS)) {
  const subset = testbed.filter((r) => r.fault_id === id || r.fault_id === 'none');
  const level = col(subset, 'severity_level');
  const byLevel = [0, 1, 2, 3].map((l) => fmt(median(col(subset.filter((r) => Number(r.severity_level) === l), fault.primary_outcome)))).join(' → ');
  lines.push(`| ${id} | ${fault.cause_group} | \`${fault.mechanism_feature}\` | ${fmt(spearman(level, col(subset, fault.mechanism_feature)), 2)} | \`${fault.primary_outcome}\` | ${fmt(spearman(level, col(subset, fault.primary_outcome)), 2)} | ${byLevel} |`);
}
lines.push('');

// (3) Nhiễu ---------------------------------------------------------------------------------------
lines.push('## 3. Noise — biến thiên giữa các lần lặp', '', '### 3.1 Testbed (môi trường xác định)', '');
const conditionCvs = [...groupBy(testbed, (r) => `${r.page_type}|${r.fault_id}|${r.severity_level}`).values()];
const cvSummary = (name, minMedian = 0) => {
  const values = conditionCvs.filter((g) => median(col(g, name)) >= minMedian).map((g) => cv(col(g, name))).filter(Number.isFinite);
  return `median CV ${pct(median(values))}, max ${pct(Math.max(...values))} (trên ${values.length} điều kiện)`;
};
lines.push(`- LCP: ${cvSummary('lh_lcp_ms')}`, `- FCP: ${cvSummary('lh_fcp_ms')}`, `- TBT30 (chỉ điều kiện có median TBT30 ≥ 50 ms): ${cvSummary('tbt_30s_ms', 50)}`, '');

lines.push('### 3.2 Trang Shopify thật', '',
  '| site / trang | đo | ok | invalid/error | LCP median [IQR] | LCP CV | LCP min–max | TBT30 median [IQR] | TBT30 CV | lh_tbt thiếu | n cần cho ±10% median* |',
  '|---|---|---|---|---|---|---|---|---|---|---|');
for (const [key, group] of groupBy(real, (r) => `${r.site} / ${r.page_type}`)) {
  const good = group.filter((r) => r.status === 'ok');
  const lcp = finite(col(good, 'lh_lcp_ms'));
  const lcpCv = cv(lcp);
  const needed = Number.isFinite(lcpCv) ? Math.ceil((1.96 * lcpCv / 0.10) ** 2) : NaN;
  const missingTbt = good.filter((r) => r.lh_tbt_ms === '').length;
  lines.push(`| ${key} | ${group.length} | ${good.length} | ${group.length - good.length} | ${medIqr(good, 'lh_lcp_ms')} | ${pct(lcpCv)} | ${fmt(Math.min(...lcp))}–${fmt(Math.max(...lcp))} | ${medIqr(good, 'tbt_30s_ms')} | ${pct(cv(col(good, 'tbt_30s_ms')))} | ${missingTbt}/${good.length} | ${fmt(needed)} |`);
}
lines.push('', '\\* Ước lượng thô số lần lặp để khoảng tin cậy 95% của LCP trung bình nằm trong ±10%: n ≈ (1,96·CV/0,10)².', '');

const flags = groupBy(rows.filter((r) => r.quality_flags), (r) => r.quality_flags);
if (flags.size) {
  lines.push('### 3.3 Cờ chất lượng', '', '| quality_flags | số dòng |', '|---|---|');
  for (const [flag, group] of flags) lines.push(`| \`${flag}\` | ${group.length} |`);
  lines.push('');
}

await writeFile(path.join(ROOT, 'docs/fault-matrix-noise-report.md'), lines.join('\n'));
console.log(`docs/fault-matrix-noise-report.md written (${rows.length} rows)`);
