# Jan — AI Agent Builder & Automation Specialist

**Live site: [janmm97.github.io/jan-website](https://janmm97.github.io/jan-website/)**

The portfolio of Jan, a Computer Science graduate who builds custom AI agents and
connected automation workflows with n8n, Claude Code, the Codex CLI and the One CLI.
Its projects take repetitive operational work (email triage, deal screening, content
production, video ads, request intake) and turn it into systems that run on their own.

[![J/OS HQ demo: an AI agent task is routed to the right workspace, planned read-only, approved once by the operator, then verified and logged](assets/images/HQ-Showcase-Video-2026-09-30.gif)](https://janmm97.github.io/jan-website/assets/images/HQ-Showcase-Video-2026-09-30.mp4)

*[▶ Watch the full-quality video (59 s)](https://janmm97.github.io/jan-website/assets/images/HQ-Showcase-Video-2026-09-30.mp4)*

## Featured projects

| Project | What it does | Built with |
|---|---|---|
| [J/OS HQ](https://github.com/janmm97/janhq) | Local command center that runs AI agents for two businesses behind one approval gate, dry-running every external write before it leaves the machine | Next.js, Claude Code, Codex CLI, One CLI |
| [J/OS Agents](https://github.com/janmm97/janhq) | Routes each request to the right business, plans against live connections and asks instead of guessing | Claude Code, Codex CLI, One CLI |
| [AI Video Ad AutoSync Pipeline](https://github.com/janmm97/n8n-proj/tree/main/sora-2-autosync-v2) | Turns a form submission into a finished vertical video ad: AI script, image-to-video, rendering and upload | n8n, Airtable, Google Drive |
| [Multi-Agent Content Automation](https://github.com/janmm97/n8n-proj/tree/main/content-automation) | Specialized AI agents plan, write and prepare social content across channels without repeating past posts | n8n, AI agents |
| [Deal Flow Checker](https://github.com/janmm97/n8n-proj/tree/main/deal-flow-checker) | Screens deal-flow emails in Gmail against acquisition criteria (industry, revenue, EBITDA, location, years active) | n8n, Gmail, AI agents |
| [Automation Idea Summary and Prompt Writer](https://github.com/janmm97/n8n-proj/tree/main/automation-idea-summary-and-prompt-writer) | Turns messy automation requests from a Google Sheet into structured, execution-ready prompts and tool lists | n8n, Google Sheets, AI agents |

## Work with me

- **[Book a 30-minute call](https://calendly.com/janmm-va/30min)**
- **[Submit a request](https://flaxen-crayon-74f.notion.site/3e57c1c329e280228fcbd4f5d6f65657?pvs=105)**

## How the site works

A static site on GitHub Pages, with no build step and no framework.

```
index.html                      home page; also holds every section (About, Projects, …)
about/ projects/ services/      section pages built from index.html by tools/pages.mjs
blog/ contact/                  (blog/<slug>/ are the blog posts, written by hand)
home/                           sends /home/ to the home page
assets/css, fonts, images, js   styles, JetBrains Mono, screenshots, scripts
tools/                          pages.mjs (section pages) and sitemap.mjs (sitemap.xml)
integrations/visitor-worker/    legacy visitor integration (not used by the site)
```

Every page has a clean URL: `/jan-website/`, `/about/`, `/projects/`, `/services/`,
`/blog/`, `/contact/` and `/blog/<slug>/`. The site never puts a `#` in the address.
Moving between sections doesn't reload the page: the script swaps the section and
updates the address with the History API, and each address is a real folder, so
reloading or sharing it works. Old `#/about`-style links are rewritten to the clean
URL on arrival. After changing `index.html`, run `node tools/pages.mjs` so the
section pages match it (`--check` reports pages that are out of date).

Visitors enter through a short bouncing-logo intro. Its progress reaches 100% before
the page opens, with a 2.8-second fallback deadline. Reduced-motion visitors see a
shorter static-logo intro. There is no registration form or visitor submission request.
The legacy worker source remains in the repository but is not connected to the page.

To preview locally, run `npx serve .` from the repository root.

## License

© Jan. All rights reserved. The code is shared for reference. The JetBrains Mono font
is licensed separately under the [SIL Open Font License](assets/fonts/OFL.txt).
