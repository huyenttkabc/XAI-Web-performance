// Sinh docs/data-dictionary.md từ src/parser/feature-definitions.js
// cộng tỉ lệ có dữ liệu (fill rate) quan sát trong data/processed/pilot-dataset.csv (nếu đã có).
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_COLUMNS } from '../src/parser/feature-definitions.js';
import { readCsv } from '../src/parser/csv-io.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATASET = path.join(ROOT, 'data/processed/pilot-dataset.csv');

/** Số ô có giá trị theo cột trong các dòng status=ok; null khi dataset chưa tồn tại. */
async function observedFillRate() {
  try {
    const okRows = (await readCsv(DATASET)).filter((row) => row.status === 'ok');
    const filled = Object.fromEntries(ALL_COLUMNS.map(({ name }) => [name, okRows.filter((row) => row[name] !== '').length]));
    return { total: okRows.length, filled };
  } catch {
    return null;
  }
}

const observed = await observedFillRate();
const fillRate = (name) => (observed?.total ? `${Math.round((100 * observed.filled[name]) / observed.total)}%` : '–');

const sections = [
  ['metadata', 'Metadata (không đưa vào X)'],
  ['target', 'Outcomes / nhãn Y'],
  ['feature', 'Features / X'],
];
const lines = [
  '# Data dictionary — pilot dataset v0.1',
  '',
  '> Sinh tự động bởi `npm run dictionary` từ `src/parser/feature-definitions.js`. Không sửa tay.',
  `> Dataset: \`data/processed/pilot-dataset.csv\` · grain: 1 dòng = 1 lần đo (url × fault condition × run)${observed ? ` · fill rate tính trên ${observed.total} dòng status=ok` : ''}.`,
  '',
];
for (const [role, title] of sections) {
  const columns = ALL_COLUMNS.filter((c) => c.role === role);
  lines.push(`## ${title} — ${columns.length} cột`, '');
  if (role === 'feature') {
    lines.push('| cột | family | cause group | đơn vị | nguồn (LH audit) | mô tả | fill rate | rủi ro leakage |', '|---|---|---|---|---|---|---|---|');
    for (const c of columns) lines.push(`| \`${c.name}\` | ${c.family} | ${c.group} | ${c.unit} | ${c.source} | ${c.description} | ${fillRate(c.name)} | ${c.leakage || ''} |`);
  } else {
    lines.push('| cột | đơn vị | mô tả | fill rate |', '|---|---|---|---|');
    for (const c of columns) lines.push(`| \`${c.name}\` | ${c.unit || ''} | ${c.description} | ${fillRate(c.name)} |`);
  }
  lines.push('');
}
await writeFile(path.join(ROOT, 'docs/data-dictionary.md'), lines.join('\n'));
console.log(`docs/data-dictionary.md: ${ALL_COLUMNS.length} columns`);
