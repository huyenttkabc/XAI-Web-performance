// Parser: MỘT raw Lighthouse report (+ trace thô) + context của lần đo → MỘT dòng dataset phẳng.
import { ALL_COLUMNS, TARGET_COLUMNS, FEATURE_COLUMNS, DIAGNOSTIC_COLUMNS } from './feature-definitions.js';
import { qualityFlags, validityFailures, shopifyDetected } from './lighthouse-report-readers.js';
import { extractMainThreadMetrics } from './trace-main-thread-extractor.js';

const TARGET_AUDITS = ['largest-contentful-paint', 'total-blocking-time', 'first-contentful-paint', 'speed-index', 'cumulative-layout-shift'];

/** Dựng một dòng. `context` chứa những gì collector biết (site, fault, run, ...); `trace` có thể null. */
export function parseMeasurement(lhr, context, trace = null) {
  const row = Object.fromEntries(ALL_COLUMNS.map((column) => [column.name, null]));
  Object.assign(row, context);
  if (!lhr) return { ...row, status: 'error' };

  row.final_url = lhr.mainDocumentUrl ?? lhr.finalDisplayedUrl ?? null;
  row.collected_at = lhr.fetchTime ?? null;
  row.lighthouse_version = lhr.lighthouseVersion ?? null;
  row.chrome_user_agent = lhr.environment?.hostUserAgent ?? null;
  row.benchmark_index = lhr.environment?.benchmarkIndex ?? null;
  row.shopify_detected = shopifyDetected(lhr);

  if (lhr.runtimeError) {
    return { ...row, status: 'error', error_message: `${lhr.runtimeError.code}: ${lhr.runtimeError.message}` };
  }
  const traceMetrics = extractMainThreadMetrics(trace, lhr);
  for (const column of [...TARGET_COLUMNS, ...FEATURE_COLUMNS, ...DIAGNOSTIC_COLUMNS]) {
    row[column.name] = column.extract(lhr, traceMetrics);
  }
  // V1–V3 xét từng dòng ở đây; V4 cần cả batch nên chạy trong rebuild-dataset-from-raw.js
  const failures = validityFailures(lhr, { expectShopify: context.site_type === 'shopify_storefront' });
  row.quality_flags = [...failures, qualityFlags(lhr, TARGET_AUDITS)].filter(Boolean).join(';');
  row.status = failures.length ? 'invalid' : 'ok';
  return row;
}
