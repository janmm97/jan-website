#!/usr/bin/env node
// Keeps sitemap.xml in step with the site's pages. No dependencies.
//
//   node tools/sitemap.mjs           report only; exit 1 if sitemap.xml is out of date
//   node tools/sitemap.mjs --write   add missing pages to sitemap.xml
//
// A page is any folder with an index.html (the home page, about/, blog/<slug>/ ...)
// that isn't marked noindex. Existing <url> entries are never rewritten or reordered:
// missing pages are appended, with <lastmod> taken from the page's JSON-LD
// dateModified/datePublished, or today's date if it has none. Entries whose page
// no longer exists are reported (not removed) so a person can decide.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE = 'https://janmm97.github.io/jan-website/';
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SKIP = new Set(['.git', '.github', 'assets', 'docs', 'integrations', 'node_modules', 'tools']);
const write = process.argv.includes('--write');

function pages(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP.has(e.name) && !e.name.startsWith('.')) out.push(...pages(join(dir, e.name)));
    } else if (e.name === 'index.html') {
      out.push(join(dir, e.name));
    }
  }
  return out;
}

function urlFor(file) {
  const rel = relative(ROOT, file).split(sep).join('/');
  return SITE + rel.replace(/(^|\/)index\.html$/, '$1');
}

function lastmodFor(html) {
  const m = html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/) || html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : new Date().toISOString().slice(0, 10);
}

const smPath = join(ROOT, 'sitemap.xml');
let sm = readFileSync(smPath, 'utf8');
const listed = new Set([...sm.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]));

const missing = [];
for (const file of pages(ROOT)) {
  const html = readFileSync(file, 'utf8');
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) continue;
  const url = urlFor(file);
  if (!listed.has(url)) missing.push({ url, lastmod: lastmodFor(html) });
}

const gone = [...listed].filter(u => {
  if (!u.startsWith(SITE)) return true;
  const rel = u.slice(SITE.length);
  return !existsSync(join(ROOT, rel, rel === '' || rel.endsWith('/') ? 'index.html' : ''));
});

for (const m of missing) console.log(`missing from sitemap: ${m.url} (lastmod ${m.lastmod})`);
for (const u of gone) console.log(`listed but no page found: ${u}`);

if (write && missing.length) {
  const nl = sm.includes('\r\n') ? '\r\n' : '\n';
  const add = missing.map(m => `  <url>${nl}    <loc>${m.url}</loc>${nl}    <lastmod>${m.lastmod}</lastmod>${nl}  </url>${nl}`).join('');
  if (!/<\/urlset>/.test(sm)) { console.error('sitemap.xml has no </urlset>'); process.exit(2); }
  sm = sm.replace(/<\/urlset>/, add + '</urlset>');
  writeFileSync(smPath, sm);
  console.log(`added ${missing.length} page(s) to sitemap.xml`);
}

if (!missing.length && !gone.length) console.log(`sitemap.xml lists all ${listed.size} pages`);
if (gone.length || (!write && missing.length)) process.exit(1);
