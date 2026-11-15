// Parser: biến MỘT raw Lighthouse report + context của lần đo thành MỘT dòng dataset phẳng.
import { ALL_COLUMNS, TARGET_COLUMNS, FEATURE_COLUMNS } from './feature-definitions.js';
import { qualityFlags } from './lighthouse-report-readers.js';

const TARGET_AUDITS = ['largest-contentful-paint', 'total-blocking-time', 'first-contentful-paint', 'speed-index', 'cumulative-layout-shift'];

/** Dựng một dòng. `context` chứa metadata collector đã biết (site, fault, run, ...). */
export function parseMeasurement(lhr, context) {
  const row = Object.fromEntries(ALL_COLUMNS.map((column) => [column.name, null]));
  Object.assign(row, context);

  if (!lhr) return { ...row, status: 'error' };

  row.final_url = lhr.finalDisplayedUrl ?? lhr.finalUrl ?? null;
  row.collected_at = lhr.fetchTime ?? null;
  row.lighthouse_version = lhr.lighthouseVersion ?? null;
  row.chrome_user_agent = lhr.environment?.hostUserAgent ?? null;

  if (lhr.runtimeError) {
    return { ...row, status: 'error', error_message: `${lhr.runtimeError.code}: ${lhr.runtimeError.message}` };
  }
  for (const column of [...TARGET_COLUMNS, ...FEATURE_COLUMNS]) {
    row[column.name] = column.extract(lhr);
  }
  row.quality_flags = qualityFlags(lhr, TARGET_AUDITS);
  row.status = 'ok';
  return row;
}
