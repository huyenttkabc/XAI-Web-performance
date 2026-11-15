// Đọc thẳng DevTools trace thô, nên các chỉ số main thread vẫn có khi Lighthouse không tính được
// TTI (NO_TTI_CPU_IDLE_PERIOD) hoặc không dựng được cây task.
//
// Outcome định nghĩa ở đây (chốt trong protocol v1.0):
//   tbt_30s_ms = Σ max(0, d − 50 ms) trên các task cấp cao nhất của main thread, mỗi task bị cắt vào cửa sổ
//                [FCP, min(navigationStart + 30 s, cuối trace)]. Cùng công thức với TBT của Lighthouse,
//                nhưng cửa sổ KHÔNG phụ thuộc TTI ⇒ vẫn tính được khi trang không bao giờ đạt TTI.
//                Trace kết thúc khi Lighthouse thấy mạng + CPU yên (hoặc khi hết 60 s); điểm kết thúc thực tế
//                được xuất ra cột `trace_window_end_ms` cho minh bạch.
const WINDOW_MS = 30_000;
const LONG_TASK_MS = 50;

/**
 * Renderer thread của main frame + navigationStart của tài liệu Lighthouse báo cáo.
 * Chỉ tính navigation tải tài liệu thật: cờ `isLoadingMainFrame` cũng xuất hiện (với URL rỗng) ở sự kiện
 * cùng-tài-liệu và ở iframe khác process (widget chat lúc 50 s+). Sau redirect phía server, URL của loader là
 * URL ĐƯỢC YÊU CẦU nên có thể không khớp mainDocumentUrl; khi đó navigation tài liệu ĐẦU TIÊN là lần tải trang.
 */
function findMainFrameNavigation(events, mainDocumentUrl) {
  const navigations = events
    .filter((e) => e.name === 'navigationStart' && e.args?.data?.isLoadingMainFrame && /^https?:/.test(e.args.data.documentLoaderURL ?? ''))
    .sort((a, b) => a.ts - b.ts);
  const exact = navigations.filter((e) => e.args.data.documentLoaderURL === mainDocumentUrl);
  return exact.at(-1) ?? navigations[0] ?? null; // khớp đúng: redirect phía client đáp xuống mainDocumentUrl sau cùng
}

/** Các sự kiện `RunTask` cấp cao nhất trên một thread, bỏ task lồng nhau. Trả [{ start, end }] theo ms. */
function topLevelTasks(events, pid, tid) {
  const tasks = events
    .filter((e) => e.pid === pid && e.tid === tid && e.ph === 'X' && e.name === 'RunTask' && Number.isFinite(e.dur))
    .map((e) => ({ start: e.ts / 1000, end: (e.ts + e.dur) / 1000 }))
    .sort((a, b) => a.start - b.start);
  const topLevel = [];
  for (const task of tasks) {
    if (topLevel.length && task.start < topLevel.at(-1).end) continue; // nằm trong task trước
    topLevel.push(task);
  }
  return topLevel;
}

/**
 * @param trace  trace đã parse ({ traceEvents }) hoặc null
 * @param lhr    Lighthouse result (lấy URL tài liệu chính và FCP dự phòng)
 * @returns { tbt_30s_ms, trace_long_task_count, trace_long_task_total_ms, trace_long_task_max_ms,
 *            trace_window_end_ms } — toàn null nếu không dùng được
 */
export function extractMainThreadMetrics(trace, lhr) {
  const empty = {
    tbt_30s_ms: null, trace_long_task_count: null, trace_long_task_total_ms: null, trace_long_task_max_ms: null, trace_window_end_ms: null,
  };
  const events = trace?.traceEvents;
  const navigation = events && findMainFrameNavigation(events, lhr?.mainDocumentUrl);
  if (!navigation) return empty;

  const navStart = navigation.ts / 1000;
  // FCP của MAIN frame (iframe cùng process cũng vẽ), lấy sớm nhất theo thời gian.
  const frame = navigation.args?.frame;
  const fcpEvents = events.filter((e) => e.name === 'firstContentfulPaint' && e.pid === navigation.pid
    && e.ts >= navigation.ts && (!frame || e.args?.frame === frame));
  const fcpFromLhr = lhr?.audits?.['first-contentful-paint']?.numericValue;
  const fcp = fcpEvents.length ? Math.min(...fcpEvents.map((e) => e.ts)) / 1000
    : Number.isFinite(fcpFromLhr) ? navStart + fcpFromLhr : null;
  const traceEnd = events.reduce((max, e) => Math.max(max, (e.ts ?? 0) + (e.dur ?? 0)), 0) / 1000;
  const windowEnd = Math.min(navStart + WINDOW_MS, traceEnd);

  const tasks = topLevelTasks(events, navigation.pid, navigation.tid)
    .filter((t) => t.end > navStart && t.start < windowEnd)
    .map((t) => ({ start: Math.max(t.start, navStart), end: Math.min(t.end, windowEnd) }));
  const longTasks = tasks.map((t) => t.end - t.start).filter((d) => d >= LONG_TASK_MS);

  let blocking = null;
  if (fcp !== null) {
    blocking = tasks
      .filter((t) => t.end > fcp)
      .reduce((sum, t) => sum + Math.max(0, t.end - Math.max(t.start, fcp) - LONG_TASK_MS), 0);
  }
  return {
    tbt_30s_ms: blocking,
    trace_long_task_count: longTasks.length,
    trace_long_task_total_ms: longTasks.reduce((a, b) => a + b, 0),
    trace_long_task_max_ms: longTasks.length ? Math.max(...longTasks) : 0,
    trace_window_end_ms: windowEnd - navStart,
  };
}
