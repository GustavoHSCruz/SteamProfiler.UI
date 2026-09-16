#!/usr/bin/env node
/* Every sp- class the React layer or the demo writes must exist in the CSS,
   and every sp- class the CSS defines must be reachable from one of them. A
   wrapper that emits a class nobody styles renders as bare HTML, silently. */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const cssText = ['tokens.css', 'components.css'].map((f) => readFileSync(join(root, 'css', f), 'utf8')).join('\n');
const defined = new Set([...cssText.matchAll(/\.(sp-[a-z0-9-]+)/g)].map((m) => m[1]));

const sources = [
  ...readdirSync(join(root, 'react')).map((f) => join(root, 'react', f)),
  join(root, 'index.html'),
];
const used = new Set();
for (const f of sources) {
  const raw = readFileSync(f, 'utf8');
  // HTML scripts also contain storage keys such as sp-lang and dictionaries;
  // these are not component class names.
  const text = f.endsWith('.html') ? raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '') : raw;
  for (const m of text.matchAll(/(?<![-\w])sp-[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+)?/g)) used.add(m[0]);
}
// Built from a variant name at runtime: sp-btn--${variant}, sp-pill--${size}.
for (const v of ['primary', 'quiet', 'danger', 'text', 'sm', 'lg']) used.add(`sp-btn--${v}`);
for (const v of ['sm', 'lg']) used.add(`sp-pill--${v}`);

const missing = [...used].filter((c) => !defined.has(c) && !c.startsWith('sp-pulse') && c !== 'sp-btn--');
const unused = [...defined].filter((c) => !used.has(c) && c !== 'sp-pulse');
if (missing.length) console.error(`used but not defined: ${missing.join(', ')}`);
if (unused.length) console.error(`defined but never shown: ${unused.join(', ')}`);
if (missing.length || unused.length) process.exit(1);
console.log(`classes: ${defined.size} defined, all used`);
