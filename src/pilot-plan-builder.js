// Mở rộng experiment manifest + danh sách site pilot thành danh sách phẳng các phép đo.
import { createHash } from 'node:crypto';
import { readCsv } from './parser/csv-io.js';

const NO_FAULT = { fault_id: 'none', fault_dose_ms: 0, fault_count: 0, cause_group: 'none' };

function measurementId(batchId, url, run) {
  return createHash('sha1').update(`${batchId}|${url}|${run}`).digest('hex');
}

/** PRNG tất định (mulberry32): cùng `seed` → cùng thứ tự xáo trộn, tái lập được. */
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Xáo trộn Fisher–Yates: rải đều độ trôi theo thời gian (máy nóng, tải nền) qua mọi điều kiện. */
function shuffle(items, seed) {
  const random = seededRandom(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Trang Shopify thật: dữ liệu quan sát, không gài lỗi. */
async function realSitePlan(manifest, sitesCsv) {
  const sites = await readCsv(sitesCsv);
  const runs = manifest.runs.real_site_pilot;
  return sites.flatMap((site) => Array.from({ length: runs }, (_, i) => ({
    site: site.site, site_type: 'shopify_storefront', page_type: site.page_type, url: site.url, run: i + 1, ...NO_FAULT,
  })));
}

/** Trang testbed × liều lỗi × số lần lặp. Dose 0 là baseline: cùng request script, không làm gì. */
function testbedPlan(manifest, baseUrl) {
  const fault = manifest.faults.find((f) => f.id === 'js-long-task');
  const { dose_ms: doses, count } = fault.parameters;
  const runs = manifest.runs.testbed_pilot;
  const plan = [];
  for (const pageType of manifest.page_types) {
    for (const dose of doses) {
      const query = `?fault=${fault.id}&dose=${dose}&count=${count}`;
      const faultMeta = dose > 0
        ? { fault_id: fault.id, fault_dose_ms: dose, fault_count: count, cause_group: fault.cause_group }
        : NO_FAULT;
      for (let run = 1; run <= runs; run += 1) {
        plan.push({ site: 'testbed', site_type: 'controlled_testbed', page_type: pageType, url: `${baseUrl}/${pageType}.html${query}`, run, ...faultMeta });
      }
    }
  }
  return plan;
}

/** scope: 'all' | 'real' | 'testbed'. Trả danh sách đã xáo trộn kèm order_index, batch_id, measurement_id. */
export async function buildPilotPlan({ manifest, sitesCsv, testbedBaseUrl, batchId, scope, seed }) {
  const plan = [
    ...(scope !== 'testbed' ? await realSitePlan(manifest, sitesCsv) : []),
    ...(scope !== 'real' ? testbedPlan(manifest, testbedBaseUrl) : []),
  ];
  return shuffle(plan, seed).map((item, index) => ({
    ...item,
    order_index: index + 1,
    batch_id: batchId,
    profile_id: manifest.measurement_profile.id,
    measurement_id: measurementId(batchId, item.url, item.run),
  }));
}
