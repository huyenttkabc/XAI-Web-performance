// Kiểm tra cú pháp mọi file .js trong src/, scripts/, test/ (bước lint trước khi commit).
import { readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const files = [];
const walk = (dir) => readdirSync(dir).forEach((name) => {
  const full = path.join(dir, name);
  if (statSync(full).isDirectory()) walk(full);
  else if (full.endsWith('.js')) files.push(full);
});
['src', 'scripts', 'test'].forEach(walk);
files.forEach((file) => execFileSync(process.execPath, ['--check', file]));
console.log(`syntax ok: ${files.length} files`);
