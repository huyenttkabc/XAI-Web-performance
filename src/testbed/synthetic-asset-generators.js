// Asset tổng hợp tất định cho testbed. Mọi hàm đều thuần (cùng input → cùng bytes),
// nên thứ duy nhất thay đổi giữa các điều kiện là mức nặng của fault.
import { deflateSync, crc32 } from 'node:zlib';
import { seededUint32 } from '../seeded-random-shuffle.js';

const HERO_WIDTH = 1200;
const HERO_HEIGHT = 600;

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData) >>> 0);
  return Buffer.concat([length, typeAndData, crc]);
}

/**
 * Ảnh PNG RGB 1200×600 nặng khoảng `kb` KB: các hàng trên là nhiễu ngẫu nhiên (không nén được),
 * phần còn lại một màu (nén gần như về 0). Dung lượng file tăng theo `kb`
 * trong khi kích thước ảnh — và do đó layout / phần tử LCP — giữ nguyên.
 */
export function heroPng(kb) {
  const rowBytes = HERO_WIDTH * 3 + 1; // +1 byte filter mỗi hàng
  const noisyRows = Math.min(HERO_HEIGHT, Math.max(0, Math.round((kb * 1024) / rowBytes)));
  const raw = Buffer.alloc(rowBytes * HERO_HEIGHT);
  const next = seededUint32(20261004);
  for (let y = 0; y < HERO_HEIGHT; y += 1) {
    const offset = y * rowBytes;
    for (let x = 1; x < rowBytes; x += 1) {
      raw[offset + x] = y < noisyRows ? next() & 0xff : [200, 115, 90][(x - 1) % 3];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(HERO_WIDTH, 0);
  header.writeUInt32BE(HERO_HEIGHT, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit, RGB, nén/filter/interlace mặc định
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Stylesheet chặn render khoảng `kb` KB, gồm các rule có selector không khớp phần tử nào trên trang. */
export function blockingCss(kb) {
  const next = seededUint32(7);
  const rules = ['/* render-blocking fault stylesheet */'];
  let size = rules[0].length;
  for (let i = 0; size < kb * 1024; i += 1) {
    const rule = `.rb-${i.toString(36)}-${next().toString(36)} > .x{margin:${i % 7}px;color:#${(next() & 0xffffff).toString(16).padStart(6, '0')}}`;
    rules.push(rule);
    size += rule.length + 1;
  }
  return rules.join('\n');
}

/** DOM thêm: `elements` phần tử hiển thị (mỗi card 4 phần tử) dưới hero — tốn bytes HTML, parse, style, layout. */
export function domBloatHtml(elements) {
  const cards = Math.floor(elements / 4);
  const parts = [];
  for (let i = 0; i < cards; i += 1) {
    parts.push(`<div class="bloat"><span>Item ${i}</span><em>variant ${i % 9}</em><b>€${(i % 90) + 9}</b></div>`);
  }
  return `<section class="bloat-list">${parts.join('')}</section>`;
}

/** Script bên thứ ba: payload khoảng `kb` KB và khoảng `cpuMs` ms công việc main thread khi chạy. */
export function thirdPartyScript(index, kb, cpuMs) {
  const padding = 'x'.repeat(Math.max(0, kb * 1024 - 300));
  return `/* third-party ${index} */(function(){var p="${padding}";var e=performance.now()+${cpuMs};while(performance.now()<e){}window.__thirdParty=(window.__thirdParty||0)+1;})();`;
}
