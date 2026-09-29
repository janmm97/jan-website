# Jan — AI Agent Builder & Automation Specialist

**Live site: [janmm97.github.io/jan-website](https://janmm97.github.io/jan-website/)**

The portfolio of Jan, a Computer Science graduate who builds custom AI agents and
connected automation workflows with n8n, Claude Code, the Codex CLI and the One CLI.
Its projects take repetitive operational work (email triage, deal screening, content
production, video ads, request intake) and turn it into systems that run on their own.

![J/OS HQ dashboard](assets/images/JOS%20Dashboard.png)

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
index.html                      single-page site (#/home, #/about, #/projects, …)
assets/css, fonts, images, js   styles, JetBrains Mono, screenshots, scripts
integrations/visitor-worker/    Cloudflare Worker behind the visitor introduction form
```

Visitors are asked for their name and email before exploring. The form posts to a
[Cloudflare Worker](integrations/visitor-worker/README.md), which validates the
submission, rate-limits it and saves it to a Notion database. The Notion token lives
only as a Cloudflare secret. No credentials are in this repository or in the files the
browser downloads.

To preview locally, run `npx serve .` from the repository root. Pages display, but the
form only saves from the published domain.

## License

© Jan. All rights reserved. The code is shared for reference. The JetBrains Mono font
is licensed separately under the [SIL Open Font License](assets/fonts/OFL.txt).
