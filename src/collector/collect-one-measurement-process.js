// Chạy ĐÚNG MỘT phép đo trong tiến trình Node riêng rồi thoát. Tiến trình cha (run-pilot.js) mở một tiến trình
// cho mỗi phép đo, nên bộ nhớ Lighthouse — kể cả của lần đo bị bỏ do timeout, vốn vẫn giữ trace — được trả
// lại cho hệ điều hành sau mỗi lần. Nếu không, một batch dài trang nặng sẽ làm cạn heap V8
// (wave 1 crash ở phép đo thứ 35, 08/10/2026).
// Dùng nội bộ: node collect-one-measurement-process.js '<json {url, measurementId, rawDir, context, hardCapMs}>'
import { collectMeasurement, killActiveChrome } from './lighthouse-collector.js';

// Cha giết tiến trình con bị treo bằng SIGTERM; Node sẽ thoát mà không chạy `finally`, để lại Chrome chạy ngầm
// tranh CPU với các phép đo sau (và làm tụt benchmark_index của chúng). Vì vậy tự tắt Chrome trước khi thoát.
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { killActiveChrome(); process.exit(1); });

const job = JSON.parse(process.argv[2]);
try {
  await collectMeasurement(job);
  process.exit(0);
} catch (error) {
  console.error(error.message); // collectMeasurement đã ghi lỗi vào context.json
  process.exit(1);
}
