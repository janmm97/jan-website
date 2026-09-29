# JWS — One configuration

This project uses **One** as its interface to third-party apps and external services
(email, calendars, CRMs, payments, docs, messaging, and so on). One is already
installed, authenticated and initialized for this project.

## Scope: this project only

- One is configured **per project** through the local `.one/` folder
  (`one init -p`). Use it only in the context of this project.
- Run every `one` command from this project root
  (`C:\Users\manal\Backup\OneDrive\Desktop\JOS\JWS`), so the CLI resolves this
  project's config and not a parent's or the global one.
- **Before any action that writes, sends, deletes or charges**, confirm the
  identity with `one --agent config path` and `one --agent whoami`. Expect:
  - `scope: project`
  - `projectRoot` is this folder
  - organization **JWS**

  If any of these differ, stop and tell me. A wrong config doesn't raise an error.
  The command just runs against someone else's connections.
- Use the project's existing One configuration. Do not create a new global setup.
- Do not reinstall or reinitialize One (`one init`, `one login`, reinstalling the
  CLI) unless the project setup is actually broken. If it is, explain what is broken
  and why a reinstall is needed before doing it.

## How to use One

When I ask you to do something involving an external app or service, use the One
tooling in this project. Don't use SDKs, direct API calls or browser automation.

1. **Read the skill first.** `C:\Users\manal\.agents\skills\one\SKILL.md` is the
   authoritative reference for One CLI syntax. Read it, plus any reference file it
   names for the feature you're using. Don't write One commands from memory.
2. **Check what's connected.** List this project's connections to see which
   platforms are available.
3. **Search** for the right action or capability for the task.
4. **Read the action's knowledge/documentation** before executing it. It gives the
   required parameters and how to pass them. Never guess an action ID or its
   parameters.
5. **Execute** the action.

Always put `--agent` right after `one` (`one --agent <command>`) to get structured
output. The only exceptions are interactive commands that have no `--agent` form.

## When to confirm with me first

**Ask before acting** on anything destructive, irreversible, security-sensitive or
externally consequential, for example:

- sending email or messages, publishing or posting
- deleting or overwriting records or files
- payments, charges, refunds or other paid or metered calls
- changing permissions, sharing, access or credentials
- triggering external workflows or automations

Where the tool supports it, show me the resolved payload (a dry run or preview)
before running it for real.

**Go ahead without asking** for read-only actions (listing, searching, reading)
and for non-destructive actions I've clearly asked for.

## Reporting

- After each action, tell me what was done, on which platform and connection, and
  whether it succeeded. Include any resulting IDs or links.
- Check the actual outcome, not only the response code. For example, confirm a sent
  message exists or read back an updated record.
- If an action fails, explain the error in plain language and work out the right
  next step: fix the parameters, check the connection, or ask me.
- Don't retry blindly or in a loop. If a send or another non-idempotent action
  times out without a clear result, check whether it already happened before
  trying again. On rate limits (429), back off. Don't hammer the API.

## Secrets

Never print, log or write API keys, tokens, passwords or other credentials. Refer
to connections by platform and name only.
