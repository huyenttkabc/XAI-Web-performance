// Khung chọn mẫu nghiên cứu chính (protocol §2): store Shopify trong crawl tham chiếu tháng 8/2026, chia tầng
// theo TBT tham chiếu của trang home thành 3 tertile light / medium / heavy, rồi rút theo thứ tự ngẫu nhiên có seed,
// xen kẽ các tầng ⇒ mọi đoạn đầu của danh sách (một wave thu thập) đều cân bằng giữa các tầng.
import { finite, median, quantile, toNumber } from '../analysis/descriptive-statistics.js';
import { shuffle } from '../seeded-random-shuffle.js';

export const STRATA = ['light', 'medium', 'heavy'];

/** Dòng tham chiếu dùng làm khung mẫu: thành công, baseline, đúng profile tham chiếu, là Shopify. */
const isFrameRow = (r) => r.status === 'ok' && r.ablation_condition === 'baseline' && r.is_reference_config === 'true' && r.platform === 'shopify';

/** Mỗi store một mục, phải có cả URL home và product; refTbt = median TBT tham chiếu của trang home. */
export function buildFrame(referenceRows) {
  const stores = new Map();
  for (const row of referenceRows.filter(isFrameRow)) {
    const store = stores.get(row.domain) ?? { site: row.domain, homeUrl: '', productUrl: '', homeTbt: [] };
    if (row.page_type === 'home') { store.homeUrl ||= row.url; store.homeTbt.push(toNumber(row.lh_tbt_ms)); }
    if (row.page_type === 'product') store.productUrl ||= row.url;
    stores.set(row.domain, store);
  }
  return [...stores.values()]
    .filter((s) => s.homeUrl && s.productUrl)
    .map(({ homeTbt, ...s }) => ({ ...s, refTbt: finite(homeTbt).length ? median(homeTbt) : NaN }))
    .sort((a, b) => a.site.localeCompare(b.site));
}

/** Điểm cắt tertile trên các store có TBT tham chiếu; thiếu TBT (không bao giờ đạt TTI) → xếp vào heavy. */
export function assignStrata(frame) {
  const values = finite(frame.map((s) => s.refTbt));
  const cuts = [quantile(values, 1 / 3), quantile(values, 2 / 3)];
  const stratumOf = (tbt) => (!Number.isFinite(tbt) || tbt > cuts[1] ? 'heavy' : tbt > cuts[0] ? 'medium' : 'light');
  return { cuts, stores: frame.map((s) => ({ ...s, stratum: stratumOf(s.refTbt) })) };
}

/** Thứ tự có seed: xáo trộn trong từng tầng, rồi lấy lần lượt light, medium, heavy, light, … */
export function interleavedOrder(stores, seed) {
  const queues = STRATA.map((name) => shuffle(stores.filter((s) => s.stratum === name), seed));
  const out = [];
  for (let i = 0; queues.some((q) => i < q.length); i += 1) {
    for (const queue of queues) if (i < queue.length) out.push(queue[i]);
  }
  return out;
}

/** Chia đều `total` cho các tầng (phần dư cho các tầng đầu), trừ đi store đã có trong nghiên cứu. */
export function stratumQuotas(total, alreadyIn) {
  return Object.fromEntries(STRATA.map((name, i) => {
    const share = Math.floor(total / STRATA.length) + (i < total % STRATA.length ? 1 : 0);
    return [name, Math.max(0, share - alreadyIn.filter((s) => s.stratum === name).length)];
  }));
}
