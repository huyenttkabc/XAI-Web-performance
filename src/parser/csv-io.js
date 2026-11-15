// Đọc/ghi CSV tối giản theo RFC 4180 (ô có dấu phẩy, ngoặc kép hoặc xuống dòng thì được bọc ngoặc kép).
import { readFile, writeFile } from 'node:fs/promises';

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'number' ? String(Math.round(value * 1000) / 1000) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Nội dung CSV đúng như ghi ra đĩa (dùng để kiểm tra bản dựng lại có giống hệt từng byte không). */
export function toCsvText(columnNames, rows) {
  const lines = [columnNames.join(','), ...rows.map((row) => columnNames.map((name) => escapeCell(row[name])).join(','))];
  return `${lines.join('\n')}\n`;
}

export async function writeCsv(filePath, columnNames, rows) {
  await writeFile(filePath, toCsvText(columnNames, rows), 'utf8');
}

/** Phân tích CSV thành mảng object theo header (ô trống → ''). */
export function parseCsv(text) {
  const records = [];
  let record = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { record.push(cell); cell = ''; }
    else if (ch === '\n') { record.push(cell); records.push(record); record = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell !== '' || record.length > 0) { record.push(cell); records.push(record); }
  const [header, ...rows] = records;
  return rows.map((cells) => Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ''])));
}

export async function readCsv(filePath) {
  return parseCsv(await readFile(filePath, 'utf8'));
}
