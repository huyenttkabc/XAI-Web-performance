// Catalog suy giảm có kiểm soát: 6 fault thuộc 5 cause group × 3 mức, mỗi lần chỉ một fault.
// Trang là template có các "khe" (slot); BASELINE điền mọi khe ở mức trung tính, nên một điều kiện lỗi
// khác baseline đúng MỘT cơ chế (thiết kế one-factor-at-a-time).
// mechanism_feature: cột dataset phải tăng theo mức (manipulation check — fault có thật sự tác động không);
// primary_outcome:   target kỳ vọng xấu đi nhiều nhất (dùng trong báo cáo nhiễu / liều–đáp ứng).
import { domBloatHtml } from './synthetic-asset-generators.js';

export const BASELINE = 'none';
export const THIRD_PARTY_SCRIPT = { kb: 20, cpuMs: 30 };
export const LONG_TASK_COUNT = 4;
export const BASELINE_HERO_KB = 20; // file sinh ra ≈25 KB (overhead PNG của các hàng một màu)

export const FAULTS = {
  'js-long-task': {
    cause_group: 'main_thread_js',
    mechanism_feature: 'mt_script_eval_ms',
    primary_outcome: 'tbt_30s_ms',
    unit: `ms per task (${LONG_TASK_COUNT} tasks after load)`,
    severities: [100, 250, 500],
    expected: 'TBT ≈ 4 × (dose − 50); LCP flat',
  },
  'dom-bloat': {
    cause_group: 'dom_layout',
    mechanism_feature: 'dom_elements',
    primary_outcome: 'lh_lcp_ms',
    unit: 'extra DOM elements below the hero',
    severities: [1500, 4000, 10000],
    expected: 'dom_elements, HTML bytes, parse/style/layout time ↑',
  },
  'lcp-heavy-image': {
    cause_group: 'lcp_resource',
    mechanism_feature: 'image_bytes',
    primary_outcome: 'lh_lcp_ms',
    unit: 'hero (LCP) image KB (baseline ≈25 KB)',
    severities: [300, 900, 2000],
    expected: 'image bytes ↑ → LCP ↑; FCP flat; TBT flat',
  },
  'render-blocking-css': {
    cause_group: 'render_blocking',
    mechanism_feature: 'stylesheet_bytes',
    primary_outcome: 'lh_fcp_ms',
    unit: 'KB of render-blocking CSS in <head> (unused rules)',
    severities: [150, 500, 1200],
    expected: 'stylesheet bytes ↑ → FCP and LCP ↑; TBT flat',
  },
  'third-party-scripts': {
    cause_group: 'third_party',
    mechanism_feature: 'third_party_requests',
    primary_outcome: 'lh_lcp_ms',
    unit: `async third-party scripts (${THIRD_PARTY_SCRIPT.kb} KB, ${THIRD_PARTY_SCRIPT.cpuMs} ms CPU each)`,
    severities: [4, 12, 30],
    expected: 'third-party requests/bytes/main-thread time ↑; script bytes ↑ (overlaps main_thread_js); TBT ≈ 0 (30 ms tasks < 50 ms)',
  },
  // Ghép cặp với js-long-task: cùng script, cùng liều, cùng request trên mọi trang (dose 0 ở baseline);
  // khác biệt DUY NHẤT là origin của long task → kiểm tra explanation có tách được JS của chính trang
  // với JS của app bên thứ ba không (third_party_main_thread_ms so với mt_script_eval_ms).
  'third-party-long-task': {
    cause_group: 'third_party',
    mechanism_feature: 'third_party_main_thread_ms',
    primary_outcome: 'tbt_30s_ms',
    unit: `ms per task (${LONG_TASK_COUNT} tasks after load, third-party origin)`,
    severities: [100, 250, 500],
    expected: 'TBT ≈ 4 × (dose − 50); third-party main-thread time ↑; requests/bytes identical to baseline; LCP flat',
  },
};

export const MAX_THIRD_PARTY_SLOTS = Math.max(...FAULTS['third-party-scripts'].severities);

/** Đọc `?fault=&dose=`; fault lạ → baseline. Dose bị kẹp vào [0, 2 × mức cao nhất]. */
export function parseCondition(searchParams) {
  const fault = searchParams.get('fault');
  if (!fault || !FAULTS[fault]) return { fault: BASELINE, dose: 0 };
  const max = 2 * Math.max(...FAULTS[fault].severities);
  const dose = Math.min(Math.max(parseInt(searchParams.get('dose') ?? '0', 10) || 0, 0), max);
  return { fault, dose };
}

/** Điền các khe của template trang cho một điều kiện. */
export function renderPage(template, { fault, dose }, thirdPartyOrigin) {
  const level = (id, neutral) => (fault === id ? dose : neutral);
  const heroKb = level('lcp-heavy-image', BASELINE_HERO_KB);
  const cssKb = level('render-blocking-css', 0);
  const activeScripts = level('third-party-scripts', 0);
  // Luôn có MAX_THIRD_PARTY_SLOTS thẻ script cùng độ dài: thẻ không hoạt động mang type không phải JS
  // (trình duyệt không tải), nên số phần tử DOM và bytes HTML không đổi theo fault này.
  const thirdParty = Array.from({ length: MAX_THIRD_PARTY_SLOTS }, (_, i) => {
    const type = i < activeScripts ? 'text/javascript' : 'text/plain-noop';
    const index = String(i).padStart(2, '0');
    return `<script type="${type}" async src="${thirdPartyOrigin}/tp-script.js?i=${index}&kb=${THIRD_PARTY_SCRIPT.kb}&cpu=${THIRD_PARTY_SCRIPT.cpuMs}"></script>`;
  }).join('\n  ');

  return template
    .replace('{{HEAD_SLOT}}', `<link rel="stylesheet" href="/faults/blocking.css?kb=${cssKb}">`)
    .replace('{{HERO_SRC}}', `/assets/hero.png?kb=${heroKb}`)
    .replace('{{AFTER_HERO_SLOT}}', domBloatHtml(level('dom-bloat', 0)))
    .replace('{{BODY_END_SLOT}}', [
      `<script src="/faults/js-long-task.js" data-dose="${level('js-long-task', 0)}" data-count="${LONG_TASK_COUNT}"></script>`,
      `<script src="${thirdPartyOrigin}/faults/js-long-task.js" data-dose="${level('third-party-long-task', 0)}" data-count="${LONG_TASK_COUNT}"></script>`,
      thirdParty,
    ].join('\n  '));
}
