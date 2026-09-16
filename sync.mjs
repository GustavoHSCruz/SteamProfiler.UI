#!/usr/bin/env node
/* Writes the built copy into the fronts that use it, the way SteamProfiler.i18n
   writes dictionaries: each consumer commits its copy, so a clone renders
   without ever having seen this repository.

     site/ui.css                                    steamprofiler-front (served, no build)
     next/src/ui-kit/{steamprofiler-ui.css,react/}  steamprofiler-front (the bench)
     src/ui-kit/{steamprofiler-ui.css,react/}       steamprofiler-duo-front
     admin/ui.css                                   steamprofiler-api (the owner panel)

   The consumers are looked for as siblings of this checkout. --check writes
   nothing and exits 1 when a copy is behind (ignoring the stamp line). */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT, css, stamp } from './build.mjs';

const WORK = resolve(ROOT, '..');
const CHECK = process.argv.includes('--check');

const targets = [
  { repo: 'steamprofiler-front', css: 'site/ui.css' },
  { repo: 'steamprofiler-front', css: 'next/src/ui-kit/steamprofiler-ui.css', react: 'next/src/ui-kit/react' },
  { repo: 'steamprofiler-duo-front', css: 'src/ui-kit/steamprofiler-ui.css', react: 'src/ui-kit/react' },
  // The owner panel, which is the first thing on the static side to use these
  // classes. It has its own copy rather than reading the front's: the panel is
  // served by its own process out of a private repository, and a file the
  // public site does not load is not a file the public site should have to
  // carry for it.
  { repo: 'steamprofiler-api', css: 'admin/ui.css' },
];

const reactHeader = () => `// ${stamp()}. Generated: edit github.com/GustavoHSCruz/SteamProfiler.UI, not this copy.\n`;
const body = (s) => s.replace(/^(\/\*|\/\/) SteamProfiler\.UI [^\n]*\n/, '');

const files = new Map(); // absolute path -> content
for (const t of targets) {
  const repo = join(WORK, t.repo);
  if (!existsSync(repo)) { console.error(`skip ${t.repo}: not checked out beside this repo`); continue; }
  files.set(join(repo, t.css), css());
  if (t.react) {
    for (const f of readdirSync(join(ROOT, 'react'))) {
      files.set(join(repo, t.react, f), reactHeader() + readFileSync(join(ROOT, 'react', f), 'utf8'));
    }
  }
}

let behind = 0;
for (const [path, content] of files) {
  const now = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (now !== null && body(now) === body(content)) continue;
  behind++;
  if (CHECK) { console.error(`behind: ${path}`); continue; }
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, content);
  console.log(`wrote ${path.slice(WORK.length + 1)}`);
}

// A component removed here leaves no stale copy behind.
for (const t of targets) {
  if (!t.react) continue;
  const dir = join(WORK, t.repo, t.react);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (existsSync(join(ROOT, 'react', f))) continue;
    behind++;
    if (CHECK) { console.error(`stale: ${join(dir, f)}`); continue; }
    rmSync(join(dir, f));
    console.log(`removed ${join(t.repo, t.react, f)}`);
  }
}

if (CHECK && behind) process.exit(1);
if (!behind) console.log('every copy is current');
