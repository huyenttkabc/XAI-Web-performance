// Collector: chạy MỘT phép đo Lighthouse theo profile đã chốt và lưu raw artifacts
// (Lighthouse report + DevTools trace + context) để sau này trích lại feature mà không phải đo lại.
import { mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const NAVIGATION_TIMEOUT_MS = 60_000;
const MEASUREMENT_TIMEOUT_MS = 150_000; // chốt chặn cứng: Lighthouse có thể treo sau load với trang rất nặng

/**
 * Cấu hình Lighthouse cho profile `mobile_cpu4x_slow4g` (xem config/experiment-manifest.json).
 * Ghi rõ từng giá trị throttling (preset slow-4G của Lighthouse) để nếu thư viện đổi mặc định
 * thì profile đã chốt cũng không bị đổi ngầm.
 */
export const LIGHTHOUSE_FLAGS = {
  output: 'json',
  logLevel: 'error',
  onlyCategories: ['performance'],
  formFactor: 'mobile',
  throttlingMethod: 'devtools', // làm chậm thật: busy-wait N ms tốn đúng N ms
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    requestLatencyMs: 562.5,
    downloadThroughputKbps: 1474.56,
    uploadThroughputKbps: 675,
    cpuSlowdownMultiplier: 4,
  },
  maxWaitForLoad: NAVIGATION_TIMEOUT_MS,
};

/** Mỗi phép đo một Chrome mới: không mang theo DNS/kết nối/TLS/cache từ lần đo trước. */
export async function launchChrome() {
  return chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-first-run', '--disable-extensions'] });
}

/** Promise thắng cuộc đua với bộ hẹn giờ; hết giờ → reject. */
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms} ms: ${label}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Đo một URL trong Chrome riêng và lưu raw artifacts vào `rawDir/<measurementId>/`.
 * `context.json` được ghi TRƯỚC (và cập nhật lỗi nếu thất bại) để lần đo nào cũng truy vết được.
 * Trả về Lighthouse result (lhr); ném lỗi nếu thất bại.
 */
export async function collectMeasurement({ url, measurementId, rawDir, context = {} }) {
  const rawPath = path.join(rawDir, measurementId);
  await mkdir(rawPath, { recursive: true });
  const saveContext = (extra = {}) =>
    writeFile(path.join(rawPath, 'context.json'), JSON.stringify({ ...context, ...extra }, null, 2));
  await saveContext();

  const chrome = await launchChrome();
  try {
    const result = await withTimeout(lighthouse(url, { ...LIGHTHOUSE_FLAGS, port: chrome.port }), MEASUREMENT_TIMEOUT_MS, url);
    if (!result?.lhr) throw new Error(`Lighthouse returned no report for ${url}`);
    await writeFile(path.join(rawPath, 'lhr.json.gz'), gzipSync(JSON.stringify(result.lhr)));
    const trace = result.artifacts?.Trace;
    if (trace) await writeFile(path.join(rawPath, 'trace.json.gz'), gzipSync(JSON.stringify(trace)));
    return result.lhr;
  } catch (error) {
    await saveContext({ error_message: error.message });
    throw error;
  } finally {
    try { await chrome.kill(); } catch { /* Chrome đã thoát */ }
  }
}
