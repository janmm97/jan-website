#!/usr/bin/env node
// Keeps the shared nav and footer the same on every page. No dependencies.
//
//   node tools/pages.mjs           rewrite the nav and footer on every page from tools/partials/
//   node tools/pages.mjs --check   exit 1 if a page's nav or footer is out of date (writes nothing)
//
// Since the E "Clearance board" redesign (2026-11) every page is its own HTML file, so this tool no
// longer builds section pages out of index.html. Each page marks the shared parts:
//   <!-- e:nav --> ... <!-- /e:nav -->     filled from tools/partials/nav.html
//   <!-- e:foot --> ... <!-- /e:foot -->   filled from tools/partials/foot.html
// Noir pages (2026-11) use <!-- n:nav --> / <!-- n:foot --> and tools/partials/noir-nav.html / noir-foot.html.
// "{R}" in a partial becomes the path back to the site root ("./", "../", "../../"), and the nav
// link of the page's own section gets aria-current="page".
// A page can relabel the nav and footer booking buttons with <body data-cta="Label"> (used by
// /services/ so every CTA on that page reads the same). Pages without it keep the partials' labels.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath decodes %20, so the tool also runs from a folder whose path has spaces.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['.git', '.github', 'assets', 'docs', 'integrations', 'node_modules', 'tools', 'home']);
const check = process.argv.includes('--check');
const part = n => readFileSync(join(ROOT, 'tools', 'partials', n + '.html'), 'utf8').replace(/\r\n/g, '\n').trimEnd();
// Two templates: the older E pages (e: markers) and the 2026-11 Noir pages (n: markers).
const PARTS = { e: { nav: part('nav'), foot: part('foot') }, n: { nav: part('noir-nav'), foot: part('noir-foot') } };

function files(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith('.')) out.push(...files(join(dir, e.name))); }
    else if (e.name === 'index.html' || (dir === ROOT && e.name === '404.html')) out.push(join(dir, e.name));
  }
  return out;
}

let stale = 0, seen = 0;
for (const file of files(ROOT)) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const src = readFileSync(file, 'utf8');
  const p = src.includes('<!-- n:nav -->') ? 'n' : src.includes('<!-- e:nav -->') ? 'e' : '';
  if (!p) continue;                                        // no shared nav markers
  seen++;
  const depth = rel.split('/').length - 1;
  const R = depth ? '../'.repeat(depth) : './';
  const section = depth ? rel.split('/')[0] : '';
  const cta = (src.match(/<body\b[^>]*\sdata-cta="([^"<>]+)"/) || [])[1];
  let html = src;
  for (const [name, body] of Object.entries(PARTS[p])) {
    let b = body.split('{R}').join(R);
    if (name === 'nav') b = b.replace(`<li><a href="${R}${section && section + '/'}">`, m => m.slice(0, -1) + ' aria-current="page">');
    if (cta && name === 'nav') b = b.replace(/(<a class="navcta"[^>]*>)[^<]*(<\/a>)/, `$1${cta}$2`);
    if (cta && name === 'foot') b = b.replace(/(<div class="foot-top">[\s\S]*?<a class="btn"[\s\S]*?<span>)[^<]*(<\/span>)/, `$1${cta}$2`);
    const re = new RegExp(`<!-- ${p}:${name} -->[\\s\\S]*?<!-- /${p}:${name} -->`);
    if (!re.test(html)) throw new Error(`${rel}: has <!-- ${p}:nav --> but no <!-- ${p}:${name} --> ... <!-- /${p}:${name} -->`);
    html = html.replace(re, () => `<!-- ${p}:${name} -->\n${b}\n<!-- /${p}:${name} -->`);
  }
  if (html === src) continue;
  stale++;
  if (check) { console.log(`out of date: ${rel}`); continue; }
  writeFileSync(file, html);
  console.log(`wrote ${rel}`);
}
if (!stale) console.log(`nav and footer are up to date on ${seen} page(s)`);
if (check && stale) process.exit(1);
