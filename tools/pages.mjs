#!/usr/bin/env node
// Builds the section pages (about/, projects/, services/, blog/, contact/) from index.html.
// No dependencies. Run from anywhere after any change to index.html:
//
//   node tools/pages.mjs           rebuild the section pages
//   node tools/pages.mjs --check   exit 1 if a section page is out of date (writes nothing)
//
// Each section page is index.html with its own <title>, meta description, canonical,
// og:/twitter: tags and a <base href="../"> so every path still resolves from the site root.
// The page script reads the route from the URL path, so /about/ opens on About and the
// address bar never shows a "#".
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://janmm97.github.io/jan-website/';
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const check = process.argv.includes('--check');

const home = {
  title: 'Jan — AI Agent Builder & Automation Specialist',
  desc: 'Jan, AI agent builder and automation specialist. Custom AI agents, n8n workflows and multi-agent systems like J/OS HQ that turn repetitive work into systems.',
};
const pages = {
  about: {
    title: 'About Jan — AI Agent Builder & Automation Specialist',
    desc: "I'm Jan. I connect operations, technology, and the way people work. Computer Science graduate, Virtual Assistant, AI Agent Builder and Automation Specialist.",
  },
  projects: {
    title: 'Projects — AI Agents & Automation Systems | Jan',
    desc: 'Selected work by Jan: Orchy, J/OS HQ, J/OS Agents and n8n automations, from multi-agent orchestrators to AI video ad pipelines.',
  },
  services: {
    title: 'Services — AI Agents & Workflow Automation | Jan',
    desc: 'Custom AI agents and connected workflows, built around the way your business works. See the process from your first idea to a system you can rely on.',
  },
  blog: {
    title: 'Blog — Notes on AI Agents & Automation | Jan',
    desc: "Jan's working notes: lessons and experiments on AI agents, automation, operations and tools, plus practical guides for virtual assistants.",
  },
  contact: {
    title: 'Contact Jan — Book a Call or Submit a Request',
    desc: 'Book a 30-minute call with Jan or submit a request. An idea, a repetitive task, or a workflow that could work better: tell me about it.',
  },
};

const src = readFileSync(join(ROOT, 'index.html'), 'utf8');
const must = (s, a, b) => { if (!s.includes(a)) throw new Error('index.html no longer contains: ' + a); return s.replace(a, () => b); };
const esc = t => t.replace(/&/g, '&amp;');

let stale = 0;
for (const [slug, p] of Object.entries(pages)) {
  const url = SITE + slug + '/';
  const cut = src.indexOf('<script type="application/ld+json">');
  let head = src.slice(0, cut), rest = src.slice(cut);
  head = must(head, '<meta name="viewport" content="width=device-width, initial-scale=1">', '<meta name="viewport" content="width=device-width, initial-scale=1">\n<base href="../">');
  head = must(head, '<link rel="canonical" href="' + SITE + '">', '<link rel="canonical" href="' + url + '">');
  head = must(head, '<meta property="og:url" content="' + SITE + '">', '<meta property="og:url" content="' + url + '">');
  head = must(head, '<title>' + home.title + '</title>', '<title>' + esc(p.title) + '</title>');
  head = head.split(home.desc).join(p.desc).split('content="' + home.title + '"').join('content="' + esc(p.title) + '"');
  head = must(head, '<noscript><style>.page.page-home{display:flex}</style></noscript>', '<noscript><style>.page[data-page="' + slug + '"]{display:block}</style></noscript>');
  // Same-page anchors (#mainContent ...) keep pointing at this page even without JavaScript.
  const html = (head + rest).replace(/href="#([A-Za-z][^"\/]*)"/g, 'href="' + slug + '/#$1"');
  if (/href="[^"]*#\//.test(html)) throw new Error(slug + ': a link still uses a #/ route');

  const file = join(ROOT, slug, 'index.html');
  const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
  if (current === html) continue;
  stale++;
  if (check) { console.log(`out of date: ${slug}/index.html`); continue; }
  mkdirSync(join(ROOT, slug), { recursive: true });
  writeFileSync(file, html);
  console.log(`wrote ${slug}/index.html`);
}
if (!stale) console.log('section pages are up to date');
if (check && stale) process.exit(1);
