// Mở rộng experiment manifest + fault catalog + danh sách site thành danh sách phép đo phẳng, đã xáo trộn.
import { createHash } from 'node:crypto';
import { readCsv } from './parser/csv-io.js';
import { FAULTS, BASELINE } from './testbed/fault-catalog.js';
import { shuffle } from './seeded-random-shuffle.js';

const NO_FAULT = { fault_id: BASELINE, fault_dose: 0, fault_unit: '', severity_level: 0, cause_group: 'none' };

export function measurementId(batchId, url, run) {
  return createHash('sha1').update(`${batchId}|${url}|${run}`).digest('hex');
}

const repeat = (runs, make) => Array.from({ length: runs }, (_, i) => make(i + 1));

/** Trang Shopify thật: dữ liệu quan sát, không gài lỗi. */
async function realSitePlan(sitesCsv, runs) {
  const sites = await readCsv(sitesCsv);
  return sites.flatMap((site) => repeat(runs, (run) => ({
    site: site.site, site_type: 'shopify_storefront', page_type: site.page_type, url: site.url, run, ...NO_FAULT,
  })));
}

/** Fault matrix: trang × (baseline + mọi fault × mức) × số lần lặp, mỗi lần một fault. */
export function testbedPlan(pageTypes, baseUrl, runs) {
  const conditions = [
    { query: '', meta: NO_FAULT },
    ...Object.entries(FAULTS).flatMap(([id, fault]) => fault.severities.map((dose, i) => ({
      query: `?fault=${id}&dose=${dose}`,
      meta: { fault_id: id, fault_dose: dose, fault_unit: fault.unit, severity_level: i + 1, cause_group: fault.cause_group },
    }))),
  ];
  return pageTypes.flatMap((pageType) => conditions.flatMap(({ query, meta }) => repeat(runs, (run) => ({
    site: 'testbed', site_type: 'controlled_testbed', page_type: pageType, url: `${baseUrl}/${pageType}.html${query}`, run, ...meta,
  }))));
}

/** scope: 'all' | 'real' | 'testbed'. Trả danh sách đã xáo trộn kèm order_index, batch_id, measurement_id. */
export async function buildPilotPlan({ manifest, sitesCsv, testbedBaseUrl, batchId, scope, seed }) {
  const plan = [
    ...(scope !== 'testbed' ? await realSitePlan(sitesCsv, manifest.runs.real_site) : []),
    ...(scope !== 'real' ? testbedPlan(manifest.page_types, testbedBaseUrl, manifest.runs.testbed) : []),
  ];
  return shuffle(plan, seed).map((item, index) => ({
    ...item,
    order_index: index + 1,
    batch_id: batchId,
    profile_id: manifest.measurement_profile.id,
    measurement_id: measurementId(batchId, item.url, item.run),
  }));
}
