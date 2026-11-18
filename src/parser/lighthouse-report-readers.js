// Các hàm đọc nhỏ, an toàn với null, trên Lighthouse result (LHR). Audit thiếu → null, KHÔNG phải 0,
// để phân biệt "không đo được" với "đo được và bằng 0".

export function auditValue(lhr, auditId) {
  const value = lhr?.audits?.[auditId]?.numericValue;
  return Number.isFinite(value) ? value : null;
}

/** Các dòng bảng của một audit; audit dạng insight có thể bọc bảng trong detail kiểu `list`. */
export function auditItems(lhr, auditId) {
  const details = lhr?.audits?.[auditId]?.details;
  if (!details) return null;
  if (Array.isArray(details.items) && details.type !== 'list') return details.items;
  if (details.type === 'list') {
    const table = details.items?.find((item) => item?.type === 'table');
    return table?.items ?? [];
  }
  return null;
}

export function resourceSummary(lhr, resourceType, field) {
  const row = auditItems(lhr, 'resource-summary')?.find((item) => item.resourceType === resourceType);
  return row ? row[field] ?? null : null;
}

/** Thời gian main thread của một nhóm; có bảng nhưng không có nhóm đó → 0 (thật sự không tốn). */
export function mainThreadGroup(lhr, group) {
  const items = auditItems(lhr, 'mainthread-work-breakdown');
  if (!items) return null;
  return items.find((item) => item.group === group)?.duration ?? 0;
}

export function sumField(items, field) {
  if (!items) return null;
  return items.reduce((total, item) => total + (Number.isFinite(item?.[field]) ? item[field] : 0), 0);
}

/** Cộng một trường số qua các dòng của audit; 0 khi audit không áp dụng (vd: không có bên thứ ba). */
export function auditFieldSum(lhr, auditId, field) {
  if (lhr?.audits?.[auditId]?.scoreDisplayMode === 'notApplicable') return 0;
  return sumField(auditItems(lhr, auditId), field);
}

/**
 * Phần tử LCP có tải tài nguyên (ảnh, video, ảnh nền) hay chỉ là chữ. Đọc từ LCP breakdown:
 * tài nguyên có 4 đoạn con, chữ chỉ có 2 (TTFB + render delay). null nếu không đọc được.
 */
export function lcpHasResource(lhr) {
  const subparts = auditItems(lhr, 'lcp-breakdown-insight');
  if (!subparts?.length) return null;
  return subparts.some((item) => item.subpart === 'resourceLoadDuration') ? 1 : 0;
}

/**
 * 1 khi một kiểm tra "khám phá LCP" THẤT BẠI (vd eagerlyLoaded=false → ảnh LCP bị lazy-load), 0 khi đạt
 * hoặc LCP là chữ (không có gì để khám phá / lazy-load), null khi không đọc được.
 */
export function lcpDiscoveryFailure(lhr, check) {
  if (lcpHasResource(lhr) === 0) return 0;
  const checklist = lhr?.audits?.['lcp-discovery-insight']?.details?.items?.find((item) => item?.type === 'checklist')?.items;
  const value = checklist?.[check]?.value;
  return typeof value === 'boolean' ? Number(!value) : null;
}

/**
 * Request mạng của tài nguyên LCP. URL của nó là phần tử đầu của initiator path mà Lighthouse ghi trong
 * `prioritize-lcp-image` (ứng viên LCP trong trace không mang URL). null nếu không tìm được.
 */
export function lcpRequest(lhr) {
  const url = lhr?.audits?.['prioritize-lcp-image']?.details?.debugData?.initiatorPath?.[0]?.url;
  if (!url) return null;
  return auditItems(lhr, 'network-requests')?.find((item) => item.url === url) ?? null;
}

/**
 * Giá trị suy ra từ request LCP; `textValue` khi LCP là chữ (không có tài nguyên để tải),
 * null khi LCP là tài nguyên nhưng không xác định được request của nó.
 */
export function lcpRequestValue(lhr, derive, textValue) {
  const hasResource = lcpHasResource(lhr);
  if (hasResource === 0) return textValue;
  const request = lcpRequest(lhr);
  return hasResource === 1 && request ? derive(request, lhr) : null;
}

/** Tổng bytes của mọi request bắt đầu TRƯỚC request LCP: băng thông mà ảnh LCP phải tranh. */
export function bytesBeforeRequest(request, lhr) {
  return (auditItems(lhr, 'network-requests') ?? [])
    .filter((item) => item.networkRequestTime < request.networkRequestTime)
    .reduce((sum, item) => sum + (Number.isFinite(item.transferSize) ? item.transferSize : 0), 0);
}

/** Số host khác nhau đã kết nối (bỏ qua data:, blob:, chrome-extension:). */
export function originCount(lhr) {
  const items = auditItems(lhr, 'network-requests');
  if (!items) return null;
  const hosts = new Set();
  for (const item of items) {
    try {
      const { protocol, host } = new URL(item.url);
      if (protocol.startsWith('http') && host) hosts.add(host);
    } catch { /* URL hỏng */ }
  }
  return hosts.size;
}

/**
 * Cờ chất lượng dữ liệu: mã lỗi Lighthouse của các target (vd NO_TTI_CPU_IDLE_PERIOD → thiếu TBT)
 * cộng `load_timeout` khi Lighthouse cảnh báo trang tải không xong.
 */
export function qualityFlags(lhr, targetAuditIds) {
  const flags = new Set();
  for (const id of targetAuditIds) {
    const code = lhr?.audits?.[id]?.errorMessage?.match(/\(([A-Z_]+)\)/)?.[1];
    if (code) flags.add(`${id}:${code}`);
  }
  if ((lhr?.runWarnings ?? []).some((w) => /loaded too slowly/i.test(w))) flags.add('load_timeout');
  return [...flags].join(';');
}

// ---- Luật hợp lệ V1–V3 (protocol v1.0 §2) -------------------------------------------------------

export const siteKey = (host) => host.replace(/^www\./, '');
export const sameSite = (a, b) => a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`); // cho phép subdomain hai chiều
export const BLOCKED_PATH = /^\/(password|challenge|checkpoint)(\/|$)/; // cổng chặn của Shopify, thường trả 200

/** Dòng của tài liệu chính: khớp đúng URL, nếu không thì request Document cuối cùng. */
function mainDocumentRequest(lhr) {
  const items = auditItems(lhr, 'network-requests') ?? [];
  return items.find((item) => item.url === lhr.mainDocumentUrl) ?? items.filter((item) => item.resourceType === 'Document').at(-1);
}

/** Có asset từ CDN Shopify, xét theo host/path (không theo chuỗi con — tránh khớp nhầm query của beacon). */
export function shopifyDetected(lhr) {
  let mainHost = '';
  try { mainHost = new URL(lhr.mainDocumentUrl).host; } catch { /* không có tài liệu chính */ }
  return (auditItems(lhr, 'network-requests') ?? []).some((item) => {
    try {
      const { host, pathname } = new URL(item.url);
      return host === 'cdn.shopify.com' || (host === mainHost && pathname.startsWith('/cdn/shop'));
    } catch { return false; }
  });
}

/**
 *  V1 cross_host_redirect — tài liệu chính HOẶC URL hiển thị rời khỏi site được yêu cầu (vd: chống bot đẩy sang google.com)
 *     storefront_blocked  — trang password / challenge / checkpoint của Shopify
 *  V2 http_error          — status của tài liệu chính ≥ 400
 *  V3 not_shopify         — storefront không có asset CDN Shopify (chỉ xét khi expectShopify)
 */
export function validityFailures(lhr, { expectShopify }) {
  const failures = [];
  try {
    const requested = siteKey(new URL(lhr.requestedUrl).host);
    const finals = [lhr.mainDocumentUrl, lhr.finalDisplayedUrl].filter(Boolean).map((u) => new URL(u));
    if (finals.some((u) => !sameSite(requested, siteKey(u.host)))) failures.push('cross_host_redirect');
    if (finals.some((u) => BLOCKED_PATH.test(u.pathname))) failures.push('storefront_blocked');
  } catch { failures.push('cross_host_redirect'); }
  if (mainDocumentRequest(lhr)?.statusCode >= 400) failures.push('http_error');
  if (expectShopify && !shopifyDetected(lhr)) failures.push('not_shopify');
  return failures;
}
