// Dựng lại mọi dòng dataset từ raw artifacts trong data/raw/<measurement_id>/ (context.json +
// lhr.json.gz + trace.json.gz). Dataset là một HÀM THUẦN của raw artifacts, code parser và profile của protocol.
import { readdir, readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { parseMeasurement } from './lighthouse-report-parser.js';
import { ALL_COLUMNS } from './feature-definitions.js';
import { toCsvText } from './csv-io.js';
import { markHostContention } from './host-contention-filter.js';

export const DATASET_COLUMNS = ALL_COLUMNS.map((c) => c.name);

/** Parse một thư mục phép đo (context.json + report/trace nén gzip) thành một dòng dataset. */
export async function parseRawMeasurement(measurementDir) {
  const context = JSON.parse(await readFile(path.join(measurementDir, 'context.json'), 'utf8'));
  const readGz = (name) => readFile(path.join(measurementDir, name)).then((buf) => JSON.parse(gunzipSync(buf)), () => null);
  // không có report → dòng status=error (error_message lấy từ context.json)
  return parseMeasurement(await readGz('lhr.json.gz'), context, await readGz('trace.json.gz'));
}

/** { rows, skipped, failed } — sắp theo batch rồi thứ tự đo; `profileId` loại dữ liệu của protocol khác (§9). */
export async function rebuildDatasetRows(rawDir, profileId) {
  const rows = [];
  const failed = [];
  let skipped = 0;
  for (const id of (await readdir(rawDir)).sort()) {
    try {
      const context = JSON.parse(await readFile(path.join(rawDir, id, 'context.json'), 'utf8'));
      if (context.profile_id !== profileId) { skipped += 1; continue; }
      rows.push(await parseRawMeasurement(path.join(rawDir, id)));
    } catch (error) {
      failed.push({ id, error: error.message });
    }
  }
  markHostContention(rows); // V4 cần cả batch nên chạy ở đây chứ không theo từng dòng
  rows.sort((a, b) => String(a.batch_id).localeCompare(String(b.batch_id)) || Number(a.order_index) - Number(b.order_index));
  return { rows, skipped, failed };
}

/** Nội dung CSV của `rows`, giống hệt từng byte với file `npm run reparse` ghi ra. */
export const datasetCsvText = (rows) => toCsvText(DATASET_COLUMNS, rows);
