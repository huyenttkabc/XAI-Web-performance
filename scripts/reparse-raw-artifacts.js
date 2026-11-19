// Dựng lại data/processed/pilot-dataset.csv từ data/raw/*/ (context.json + lhr.json.gz + trace.json.gz)
// mà KHÔNG đo lại — dùng sau khi thêm hoặc sửa feature trong src/parser/.
// Chỉ lấy phép đo của profile hiện hành (manifest); dữ liệu protocol cũ nằm ở data/archive/ (§9).
// Store case study RQ4 (config/case-study-sites.csv) thuộc nhánh C, không bao giờ vào dataset chính:
// nếu lọt vào, dataset v1.0 đã đóng băng sẽ không dựng lại được từ raw (Gate G3).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rebuildDatasetRows, datasetCsvText } from '../src/parser/rebuild-dataset-from-raw.js';
import { readCsv } from '../src/parser/csv-io.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_CSV = path.join(ROOT, 'data/processed/pilot-dataset.csv');
const manifest = JSON.parse(await readFile(path.join(ROOT, 'config/experiment-manifest.json'), 'utf8'));
const caseStudySites = new Set(
  (await readCsv(path.join(ROOT, 'config/case-study-sites.csv')).catch(() => [])).map((r) => r.site),
);

const { rows: allRows, skipped, failed } = await rebuildDatasetRows(path.join(ROOT, 'data/raw'), manifest.measurement_profile.id);
const rows = allRows.filter((r) => !caseStudySites.has(r.site));
for (const { id, error } of failed) console.warn(`skip ${id}: ${error}`);
await mkdir(path.dirname(OUT_CSV), { recursive: true });
await writeFile(OUT_CSV, datasetCsvText(rows), 'utf8');
console.log(`re-parsed ${rows.length} measurements → ${path.relative(ROOT, OUT_CSV)} ` +
  `(skipped ${skipped} from other profiles, ${allRows.length - rows.length} case-study rows kept out)`);
