import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const DIST = 'dist';

/** Every file under dist/, as forward-slash paths relative to dist/. */
export function distFiles(dir = DIST) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join('/'))
    .sort();
}
