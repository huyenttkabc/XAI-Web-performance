// In metadata feature/target từ feature-definitions.js ra JSON, để code mô hình Python đọc CÙNG một nguồn sự thật
// (tên cột, family S/R, cause group, loại trừ leakage theo target). Không định nghĩa feature lần thứ hai bên Python.
// Cách dùng: node scripts/export-feature-metadata.js
import { FEATURE_COLUMNS, TARGET_COLUMNS } from '../src/parser/feature-definitions.js';

const metadata = {
  features: FEATURE_COLUMNS.map(({ name, family, group, excludeFor }) => ({ name, family, group, excludeFor })),
  targets: TARGET_COLUMNS.map(({ name, tier }) => ({ name, tier })),
};
process.stdout.write(`${JSON.stringify(metadata)}\n`);
