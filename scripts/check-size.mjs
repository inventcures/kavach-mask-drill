// Fails the build if dist/ is over the size budget (spec 6.1: 250 KB gzipped in total).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { DIST, distFiles } from './dist-files.mjs';

const BUDGET_BYTES = 250 * 1024;

const sizes = distFiles().map((file) => [file, gzipSync(readFileSync(join(DIST, file)), { level: 9 }).length]);
const total = sizes.reduce((sum, [, bytes]) => sum + bytes, 0);
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

for (const [file, bytes] of sizes) console.log(`${kb(bytes).padStart(10)}  ${file}`);
console.log(`${kb(total).padStart(10)}  total gzipped (budget ${kb(BUDGET_BYTES)})`);

if (total > BUDGET_BYTES) {
  console.error(`dist/ is ${kb(total - BUDGET_BYTES)} over the size budget.`);
  process.exit(1);
}
