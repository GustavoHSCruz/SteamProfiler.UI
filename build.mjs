#!/usr/bin/env node
/* dist/steamprofiler-ui.css: tokens then components, one file, with a header
   saying which commit it came from. The React layer is not built: every
   consumer compiles TypeScript already, so it is copied as source by sync.mjs. */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

export function stamp() {
  let sha = 'uncommitted';
  try {
    sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const dirty = execFileSync('git', ['status', '--porcelain', '--', 'css', 'react'], { cwd: ROOT }).toString().trim();
    if (dirty) sha += '+dirty';
  } catch { /* no git: a tarball */ }
  return `SteamProfiler.UI ${pkg.version} (${sha})`;
}

export function css() {
  const parts = ['tokens.css', 'components.css'].map((f) => readFileSync(join(ROOT, 'css', f), 'utf8').trim());
  return `/* ${stamp()}. Generated: edit github.com/GustavoHSCruz/SteamProfiler.UI, not this copy. */\n\n${parts.join('\n\n')}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  writeFileSync(join(ROOT, 'dist/steamprofiler-ui.css'), css());
  console.log(`dist/steamprofiler-ui.css  ${stamp()}`);
}
