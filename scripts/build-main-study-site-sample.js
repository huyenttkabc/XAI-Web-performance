// Rút mẫu store cho nghiên cứu chính (protocol §2) và ghi config/main-study-sites.csv.
// Cách dùng: node scripts/build-main-study-site-sample.js [--total=40] [--wave1=12] [--seed=42] [--extend]
//  total   số store trong nghiên cứu, gồm cả store pilot (chúng đến từ cùng khung mẫu)
//  wave1   số store mới đo ở wave 1; phần còn lại là wave 2. Store pilot là wave 0 (đã đo theo protocol v1.0).
//  extend  giữ nguyên mọi store đã có trong config/main-study-sites.csv (không probe lại), bỏ qua store từng bị
//          loại, rồi rút TIẾP theo đúng thứ tự có seed cũ cho đến --total; store mới thành wave kế tiếp.
//          Kết quả tương đương với việc rút --total store ngay từ đầu.
//  replace=a.com,b.com (dùng kèm --extend) bỏ các store này khỏi mẫu — probe đã nhận nhưng không phép đo nào hợp lệ
//          (vd redirect chỉ xảy ra trong trình duyệt sang host khác) — và rút store thay thế CÙNG TẦNG theo thứ tự có seed.
//          Store bị thay được ghi log, không bao giờ được rút lại; raw của chúng vẫn nằm trong data/raw.
// Ứng viên được probe theo thứ tự xen kẽ có seed cho đến khi đủ quota mọi tầng ⇒ tái lập được,
// trừ những store đã đổi trạng thái (đóng cửa, bị chặn) kể từ lần chạy trước.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCsv, writeCsv } from '../src/parser/csv-io.js';
import { buildFrame, assignStrata, interleavedOrder, stratumQuotas, STRATA } from '../src/sampling/stratified-site-sampler.js';
import { probeStorefront } from '../src/sampling/storefront-probe.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => Number(process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback);
const TOTAL = arg('total', 40);
const WAVE1 = arg('wave1', 12);
const SEED = arg('seed', 42);
const EXTEND = process.argv.includes('--extend');
const SITES_CSV = path.join(ROOT, 'config/main-study-sites.csv');
const LOG_JSON = path.join(ROOT, 'data/processed/site-sampling-log.json');
const REPLACE = (process.argv.find((a) => a.startsWith('--replace='))?.split('=')[1] ?? '').split(',').filter(Boolean);
if (REPLACE.length && !EXTEND) throw new Error('--replace requires --extend');
const PAUSE_MS = 1000; // nghỉ giữa các store: lịch sự với server

const manifest = JSON.parse(await readFile(path.join(ROOT, 'config/experiment-manifest.json'), 'utf8'));
const { cuts, stores } = assignStrata(buildFrame(await readCsv(manifest.reference_dataset.path)));
const pilotSites = [...new Set((await readCsv(path.join(ROOT, 'config/pilot-sites.csv'))).map((r) => r.site))];
const pilot = pilotSites.map((site) => {
  const stratum = stores.find((s) => s.site === site)?.stratum;
  if (!stratum) console.warn(`warning: pilot store ${site} is not in the frame → counted as heavy`);
  return { site, stratum: stratum ?? 'heavy' };
});
const quotas = stratumQuotas(TOTAL, pilot);
console.log(`frame: ${stores.length} stores · TBT tertile cuts ${cuts.map(Math.round).join(' / ')} ms · quotas ${JSON.stringify(quotas)}`);

// Mở rộng: store đã có trong mẫu được tính vào quota và không bao giờ probe lại.
const sampleRows = EXTEND ? await readCsv(SITES_CSV) : [];
const unknown = REPLACE.filter((site) => !sampleRows.some((r) => r.site === site && Number(r.wave) > 0));
if (unknown.length) throw new Error(`--replace: not a sampled (wave > 0) store: ${unknown}`);
const existingRows = sampleRows.filter((r) => !REPLACE.includes(r.site)); // store bị thay rời mẫu, quota tầng đó trống lại
const previousLog = EXTEND ? JSON.parse(await readFile(LOG_JSON, 'utf8')) : null;
const rejectedBefore = new Set([
  ...(previousLog?.probes ?? []).filter((p) => !p.ok).map((p) => p.site),
  ...(previousLog?.extensions ?? []).flatMap((e) => e.replaced ?? []), // store đã bị thay ở lần trước
  ...REPLACE,
]);
const kept = stores.filter((s) => existingRows.some((r) => r.site === s.site && Number(r.wave) > 0));
const nextWave = Math.max(0, ...sampleRows.map((r) => Number(r.wave))) + 1; // tính cả store bị thay: wave mới luôn lớn hơn

const accepted = [...kept];
const log = [];
for (const store of interleavedOrder(stores.filter((s) => !pilotSites.includes(s.site)), SEED)) {
  if (STRATA.every((name) => accepted.filter((s) => s.stratum === name).length >= quotas[name])) break;
  if (accepted.filter((s) => s.stratum === store.stratum).length >= quotas[store.stratum]) continue;
  if (kept.includes(store) || rejectedBefore.has(store.site)) continue;
  const result = await probeStorefront(store);
  log.push({ site: store.site, stratum: store.stratum, ref_tbt_ms: Math.round(store.refTbt) || null, ...result });
  console.log(`${result.ok ? 'accept' : 'reject'} ${store.stratum.padEnd(6)} ${store.site} ${result.ok ? result.note : result.reason}`);
  if (result.ok) accepted.push({ ...store, ...result });
  await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
}

// Wave 1 = WAVE1 / 3 store được nhận đầu tiên của mỗi tầng (vẫn cân bằng khi probe loại bớt một số store).
const perStratumWave1 = Math.ceil(WAVE1 / STRATA.length);
const rankInStratum = (s) => accepted.filter((a) => a.stratum === s.stratum).indexOf(s);
const pilotRows = (await readCsv(path.join(ROOT, 'config/pilot-sites.csv'))).map((r) => ({
  ...r, stratum: pilot.find((p) => p.site === r.site).stratum, wave: 0, note: `pilot store; ${r.note}`,
}));
const waveOf = (s) => (EXTEND ? nextWave : rankInStratum(s) < perStratumWave1 ? 1 : 2);
const newRows = accepted.filter((s) => !kept.includes(s)).flatMap((s) => [['home', s.homeUrl], ['product', s.productUrl]].map(([page_type, url]) => ({
  site: s.site, page_type, url, stratum: s.stratum, wave: waveOf(s), note: s.note,
})));
const rows = EXTEND ? [...existingRows, ...newRows] : [...pilotRows, ...newRows];
await writeCsv(SITES_CSV, ['site', 'page_type', 'url', 'stratum', 'wave', 'note'], rows);
const run = { generated_at: new Date().toISOString(), seed: SEED, total: TOTAL, frame_stores: stores.length, tbt_tertile_cuts_ms: cuts, quotas_after_pilot: quotas };
await writeFile(LOG_JSON, JSON.stringify(EXTEND
  ? { ...previousLog, extensions: [...(previousLog.extensions ?? []), { ...run, wave: nextWave, kept: kept.length, ...(REPLACE.length && { replaced: REPLACE }) }], probes: [...previousLog.probes, ...log] }
  : { ...run, wave1: WAVE1, pilot, probes: log }, null, 2));
const short = STRATA.filter((name) => accepted.filter((s) => s.stratum === name).length < quotas[name]);
console.log(`${accepted.length} sampled + ${pilot.length} pilot stores (${accepted.length - kept.length} new${EXTEND ? `, wave ${nextWave}` : ''}) → config/main-study-sites.csv${short.length ? ` (frame exhausted for ${short})` : ''}`);
