// EDA ban đầu (W3) → docs/eda-report.md + docs/figures/eda-*.svg
// Đơn vị phân tích: một trang Shopify thật (store × loại trang) = median các lần đo hợp lệ, để các lần lặp
// không thổi phồng n hay tương quan. Điều kiện testbed đã tóm tắt trong fault-matrix-noise-report.md.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCsv } from '../src/parser/csv-io.js';
import { FEATURE_COLUMNS, TARGET_COLUMNS } from '../src/parser/feature-definitions.js';
import { toNumber, finite, median, quantile, spearman, fmt, groupBy } from '../src/analysis/descriptive-statistics.js';
import { histogramSvg, heatmapSvg } from '../src/analysis/svg-charts.js';
import { isLockboxSite } from '../src/analysis/site-split-hash.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIG_DIR = path.join(ROOT, 'docs/figures');
const PRIMARY = ['lh_lcp_ms', 'tbt_30s_ms'];
const table = (header, rows) => [`| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)];
const num = (v, name) => fmt(v, name === 'lh_cls' || name === 'lh_perf_score' ? 2 : 0);

const rows = (await readCsv(path.join(ROOT, 'data/processed/pilot-dataset.csv'))).filter((r) => r.status === 'ok' && r.site_type === 'shopify_storefront' && !isLockboxSite(r.site)); // lockbox không bao giờ được nhìn (protocol §8)
const strata = new Map((await readCsv(path.join(ROOT, 'config/main-study-sites.csv'))).map((p) => [p.site, p.stratum]));
const columns = [...TARGET_COLUMNS, ...FEATURE_COLUMNS].map((c) => c.name);
const pages = [...groupBy(rows, (r) => `${r.site}|${r.page_type}`)].map(([key, group]) => {
  const [site, page_type] = key.split('|');
  return { site, page_type, stratum: strata.get(site) ?? '–', runs: group.length,
    ...Object.fromEntries(columns.map((c) => [c, median(group.map((r) => toNumber(r[c])))])) };
});
const col = (subset, name) => subset.map((p) => p[name]);
const sites = new Set(pages.map((p) => p.site));

const lines = [
  '# EDA ban đầu — dataset v0.4 (Shopify thật)', '',
  '> Sinh tự động bởi `node scripts/build-eda-report.js`. Không sửa tay.',
  `> Đơn vị: **1 trang** (store × loại trang) = median các lần đo hợp lệ. ${sites.size} store · ${pages.length} trang · ${rows.length} phép đo hợp lệ.`,
  '> Site thuộc **lockbox** (protocol §8) bị loại khỏi EDA. Mọi con số là mô tả, chưa dùng để kết luận hay chọn feature.', '',
];

// 1. Sample by stratum --------------------------------------------------------------------------
lines.push('## 1. Mẫu theo tầng (reference TBT)', '',
  ...table(['tầng', 'store', 'trang', 'TBT30 median (ms)', 'LCP median (ms)'], ['light', 'medium', 'heavy'].map((s) => {
    const group = pages.filter((p) => p.stratum === s);
    return [s, new Set(group.map((p) => p.site)).size, group.length, fmt(median(col(group, 'tbt_30s_ms'))), fmt(median(col(group, 'lh_lcp_ms')))];
  })), '', 'Kiểm tra hợp lý: nếu phân tầng có ý nghĩa thì TBT30 tăng dần light → heavy.', '');

// 2. Target distributions -----------------------------------------------------------------------
const quantRow = (name, values) => [`\`${name}\``, finite(values).length, ...[0, 0.25, 0.5, 0.75, 1].map((q) => num(quantile(values, q), name))];
lines.push('## 2. Phân phối target (theo loại trang)', '');
for (const [pageType, group] of groupBy(pages, (p) => p.page_type)) {
  lines.push(`### ${pageType}`, '', ...table(['target', 'n', 'min', 'p25', 'median', 'p75', 'max'], TARGET_COLUMNS.map((c) => quantRow(c.name, col(group, c.name)))), '');
}
await mkdir(FIG_DIR, { recursive: true });
for (const [name, title] of [['lh_lcp_ms', 'LCP'], ['tbt_30s_ms', 'TBT (30 s window)']]) {
  await writeFile(path.join(FIG_DIR, `eda-hist-${name}.svg`), histogramSvg({ values: col(pages, name), title: `${title}, real Shopify pages`, xLabel: `${title} (ms)`, log: true }));
  lines.push(`![${title}](figures/eda-hist-${name}.svg)`, '');
}
lines.push('Thời gian lệch phải mạnh (vài trang rất nặng) → khi huấn luyện cân nhắc biến đổi log của target; quyết định thuộc preprocessing trong inner-CV (protocol §8).', '');

// 3. Feature distributions ----------------------------------------------------------------------
lines.push('## 3. Phân phối feature (median theo trang)', '',
  ...table(['feature', 'bộ', 'nhóm', 'n', 'min', 'p25', 'median', 'p75', 'max'], FEATURE_COLUMNS.map((c) => {
    const [name, ...rest] = quantRow(c.name, col(pages, c.name));
    return [name, c.family === 'structural' ? 'S' : 'R', c.group, ...rest];
  })), '');

// 4. Correlations -------------------------------------------------------------------------------
const rho = (a, b) => {
  const pairs = pages.filter((p) => Number.isFinite(p[a]) && Number.isFinite(p[b]));
  return pairs.length >= 5 ? spearman(col(pairs, a), col(pairs, b)) : NaN;
};
lines.push('## 4. Tương quan Spearman feature ↔ target', '',
  ...table(['feature', 'bộ', 'ρ với LCP', 'ρ với TBT30', 'ghi chú'], FEATURE_COLUMNS
    .map((c) => ({ c, l: rho(c.name, 'lh_lcp_ms'), t: rho(c.name, 'tbt_30s_ms') }))
    .sort((a, b) => Math.max(Math.abs(b.l), Math.abs(b.t)) - Math.max(Math.abs(a.l), Math.abs(a.t)))
    .map(({ c, l, t }) => [`\`${c.name}\``, c.family === 'structural' ? 'S' : 'R', fmt(l, 2), fmt(t, 2), c.excludeFor.includes('tbt_30s_ms') ? 'loại khi target = TBT (L5)' : ''])), '');
const heatLabels = [...PRIMARY, ...FEATURE_COLUMNS.map((c) => c.name)];
await writeFile(path.join(FIG_DIR, 'eda-spearman-heatmap.svg'), heatmapSvg({
  matrix: heatLabels.map((a) => heatLabels.map((b) => (a === b ? 1 : rho(a, b)))), labels: heatLabels,
  title: `Spearman correlation, real Shopify pages (n = ${pages.length})`,
}));
lines.push('![Spearman heatmap](figures/eda-spearman-heatmap.svg)', '',
  'Cặp feature tương quan rất cao (|ρ| > 0,9) chia sẻ đóng góp SHAP tùy ý → lý do gộp SHAP theo cause group (protocol §8).', '');

// 5. Per-site summary ---------------------------------------------------------------------------
lines.push('## 5. Tóm tắt theo store', '',
  ...table(['store', 'tầng', 'trang', 'runs ok', 'LCP', 'TBT30', 'requests', 'KB tải', '3rd-party req', 'DOM'], pages
    .sort((a, b) => a.site.localeCompare(b.site) || a.page_type.localeCompare(b.page_type))
    .map((p) => [p.site, p.stratum, p.page_type, p.runs, fmt(p.lh_lcp_ms), fmt(p.tbt_30s_ms), fmt(p.request_count), fmt(p.transfer_bytes_total / 1024), fmt(p.third_party_requests), fmt(p.dom_elements)])), '');

lines.push('## 6. Tóm tắt theo điều kiện (testbed)', '', 'Xem `docs/fault-matrix-noise-report.md` (median [IQR] theo fault × mức × trang, manipulation check, dose–response).', '');
await writeFile(path.join(ROOT, 'docs/eda-report.md'), `${lines.join('\n')}\n`);
console.log(`docs/eda-report.md + 3 figures · ${sites.size} stores, ${pages.length} pages`);
