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

/**
 * Độ dài (ms) các task cấp cao nhất ≥ 50 ms. Đọc từ `main-thread-tasks` chứ không phải `long-tasks`:
 * `long-tasks` chỉ liệt kê tối đa 20 task và báo lỗi cùng TBT khi không đạt được TTI.
 */
export function longTaskDurations(lhr) {
  const items = auditItems(lhr, 'main-thread-tasks');
  return items ? items.map((item) => item.duration).filter((d) => Number.isFinite(d) && d >= 50) : null;
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
