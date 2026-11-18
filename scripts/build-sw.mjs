// Writes dist/sw.js from scripts/sw-template.js with the list of built files to precache.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, distFiles } from './dist-files.mjs';

const files = distFiles().filter((file) => file !== 'sw.js');
const hash = createHash('sha256');
for (const file of files) hash.update(file).update(readFileSync(join(DIST, file)));

const precache = ['./', ...files.map((file) => `./${file}`)];
const sw = readFileSync(new URL('./sw-template.js', import.meta.url), 'utf8')
  .replace('__VERSION__', `mask-drill-${hash.digest('hex').slice(0, 12)}`)
  .replace('__FILES__', JSON.stringify(precache));

writeFileSync(join(DIST, 'sw.js'), sw);
console.log(`sw.js: precaching ${precache.length} entries`);
