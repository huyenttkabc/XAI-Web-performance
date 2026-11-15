// Kiểm tra "còn sống" nhẹ trước khi nhận một store vào mẫu (≤ 4 GET mỗi store, tuần tự, user agent tự xưng
// là probe nghiên cứu; store từ chối client tự động thì bị loại, KHÔNG bao giờ lách).
// Chỉ lọc store chết / bị chặn và thay URL sản phẩm đã gỡ; tính hợp lệ của từng phép đo vẫn do V1–V4 quyết định.
import { siteKey, sameSite, BLOCKED_PATH } from '../parser/lighthouse-report-readers.js';

const USER_AGENT = 'Mozilla/5.0 (compatible; XAI-Web-performance research probe; one-off liveness check)';
const TIMEOUT_MS = 15000;

async function get(url) {
  const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  return { status: response.status, finalUrl: new URL(response.url), body: await response.text() };
}

/** Lý do một trang storefront không dùng được, hoặc null khi nó là trang Shopify còn sống của `site`. */
export function pageProblem(site, { status, finalUrl, body }) {
  if (status >= 400) return `http_${status}`;
  if (!sameSite(siteKey(site), siteKey(finalUrl.host))) return 'cross_host_redirect';
  if (BLOCKED_PATH.test(finalUrl.pathname)) return 'storefront_blocked';
  if (!/cdn\.shopify\.com|\/cdn\/shop\//.test(body)) return 'not_shopify';
  return null;
}

/** URL sản phẩm đầu tiên từ feed công khai /products.json của store, hoặc null. */
async function freshProductUrl(origin) {
  try {
    const { status, body } = await get(`${origin}/products.json?limit=1`);
    const handle = status < 400 ? JSON.parse(body)?.products?.[0]?.handle : null;
    return handle ? `${origin}/products/${handle}` : null;
  } catch { return null; }
}

/** { ok, reason, homeUrl, productUrl, note } cho một store của khung mẫu. */
export async function probeStorefront({ site, homeUrl, productUrl }) {
  try {
    const home = await get(homeUrl);
    const homeProblem = pageProblem(site, home);
    if (homeProblem) return { ok: false, reason: `home:${homeProblem}` };

    const product = await get(productUrl).catch(() => null);
    const productOk = product && !pageProblem(site, product) && product.finalUrl.pathname.includes('/products/');
    if (productOk) return { ok: true, homeUrl, productUrl, note: 'reference product URL live' };

    const replacement = await freshProductUrl(new URL(homeUrl).origin);
    const check = replacement ? await get(replacement).catch(() => null) : null;
    if (check && !pageProblem(site, check) && check.finalUrl.pathname.includes('/products/')) return { ok: true, homeUrl, productUrl: replacement, note: 'product URL refreshed from /products.json' };
    return { ok: false, reason: 'product:no_live_product' };
  } catch (error) {
    return { ok: false, reason: `probe_error:${error.name}` };
  }
}
