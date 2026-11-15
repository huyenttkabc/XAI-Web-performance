// Sinh docs/leakage-checklist.md: luật leakage theo định nghĩa lấy từ code (feature-definitions.js)
// + sàng lọc thực nghiệm |Spearman ρ(feature, target)| trên dữ liệu pilot.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCsv } from '../src/parser/csv-io.js';
import { METADATA_COLUMNS, TARGET_COLUMNS, FEATURE_COLUMNS, DIAGNOSTIC_COLUMNS } from '../src/parser/feature-definitions.js';
import { toNumber, spearman, fmt } from '../src/analysis/descriptive-statistics.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NEAR_DETERMINISTIC = 0.95;
const rows = (await readCsv(path.join(ROOT, 'data/processed/pilot-dataset.csv'))).filter((r) => r.status === 'ok');
const subsets = {
  real: rows.filter((r) => r.site_type === 'shopify_storefront'),
  testbed: rows.filter((r) => r.site_type === 'controlled_testbed'),
};
const primaryTargets = TARGET_COLUMNS.filter((t) => t.tier === 'primary').map((t) => t.name);
const rho = (subset, feature, target) => spearman(subset.map((r) => toNumber(r[feature])), subset.map((r) => toNumber(r[target])));

const lines = [
  '# Leakage checklist (protocol v1.0)',
  '',
  '> Sinh tự động bởi `node scripts/build-leakage-checklist.js` từ `src/parser/feature-definitions.js` và dữ liệu pilot. Không sửa tay.',
  '',
  '## A. Luật theo định nghĩa (bắt buộc, kiểm tra bằng code)',
  '',
  '| # | Loại leakage | Luật | Trạng thái |',
  '|---|---|---|---|',
  `| L1 | Nhãn nguyên nhân lọt vào X | \`fault_id\`, \`fault_dose\`, \`severity_level\`, \`cause_group\` là metadata, không bao giờ vào X | ✅ role=metadata (${METADATA_COLUMNS.length} cột metadata) |`,
  '| L2 | Định danh site/thời gian | `site`, `url`, `run`, `order_index`, `batch_id`, `collected_at`, `benchmark_index` không vào X | ✅ role=metadata |',
  '| L3 | Target làm feature | các outcome khác (LCP, TBT, FCP, SI, CLS, score) không dùng làm X cho nhau | ✅ role=target |',
  `| L4 | Tổng/ước lượng của target | ${DIAGNOSTIC_COLUMNS.map((c) => `\`${c.name}\``).join(', ')} chỉ để phân tích | ✅ role=diagnostic |`,
  '| L5 | Cùng sự kiện + cùng ngưỡng với target | xem bảng B (`excludeFor`) | ✅ loại theo từng target |',
  '| L6 | Cùng site ở train và test | GroupKFold theo `site` (k = 5); lockbox ~20% site | ✅ quy tắc băm cố định trong manifest |',
  '| L7 | Lặp lại của cùng điều kiện ở train và test (RQ3) | GroupKFold theo `run`: train 4 lần lặp, giải thích lần còn lại | ✅ manifest `splits.rq3_testbed` |',
  '| L8 | Chọn feature/tham số nhìn vào test | feature selection, tuning chỉ trong inner-CV của fold train | ⏳ luật đã chốt; kiểm tra khi có pipeline ML (W4) |',
  '| L9 | Tiền xử lý fit trên toàn bộ dữ liệu | imputer/scaler fit trong pipeline theo từng fold | ⏳ luật đã chốt; kiểm tra khi có pipeline ML (W4) |',
  '',
  '## B. Loại trừ theo target (`excludeFor`)',
  '',
  '| feature | loại khỏi X khi target là | lý do |',
  '|---|---|---|',
];
for (const f of FEATURE_COLUMNS.filter((c) => c.excludeFor.length)) {
  lines.push(`| \`${f.name}\` | ${f.excludeFor.map((t) => `\`${t}\``).join(', ')} | tính từ cùng các task ≥ 50 ms như TBT |`);
}

lines.push('', `## C. Sàng lọc thực nghiệm — |ρ Spearman| ≥ ${NEAR_DETERMINISTIC}`, '',
  `Dữ liệu: ${subsets.real.length} dòng Shopify thật (ok), ${subsets.testbed.length} dòng testbed (ok).`,
  'Trên **testbed**, ρ cao với đặc trưng cơ chế là *chủ ý thiết kế* (fault điều khiển trực tiếp cơ chế) → chỉ để tham khảo.',
  `Trên **site thật** (${new Set(subsets.real.map((r) => r.site)).size} site), |ρ| ≥ 0,95 nghĩa là đặc trưng gần như là một phép biến đổi của target → phải xem xét loại. Kiểm tra lại khi có ≥ 30 site (W3).`, '');
for (const target of primaryTargets) {
  lines.push(`### Target \`${target}\``, '', '| feature | family | group | ρ real | ρ testbed | cờ |', '|---|---|---|---|---|---|');
  const scored = FEATURE_COLUMNS.map((f) => ({ f, real: rho(subsets.real, f.name, target), bed: rho(subsets.testbed, f.name, target) }))
    .sort((a, b) => (Math.abs(b.real) || 0) - (Math.abs(a.real) || 0));
  for (const { f, real, bed } of scored) {
    const excluded = f.excludeFor.includes(target);
    const flag = excluded ? 'loại (L5)' : Math.abs(real) >= NEAR_DETERMINISTIC ? '⚠ xem xét' : '';
    lines.push(`| \`${f.name}\` | ${f.family} | ${f.group} | ${fmt(real, 2)} | ${fmt(bed, 2)} | ${flag} |`);
  }
  lines.push('');
}

await writeFile(path.join(ROOT, 'docs/leakage-checklist.md'), lines.join('\n'));
console.log(`docs/leakage-checklist.md written (${rows.length} ok rows)`);
