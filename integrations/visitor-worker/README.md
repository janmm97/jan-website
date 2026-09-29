# Visitor registration: GitHub Pages → Worker → Notion

The portfolio stays static on GitHub Pages. Deploy this endpoint separately to Cloudflare Workers. It stores names and emails in the supplied Notion database. On 2026-09-30 the live schema was read through a separate Notion connection: one data source with a `Name` title property and an `Email` property of type Email. The Worker integration's own permissions are confirmed only by step 7.

## Activate

1. Create a Notion internal integration with read-content and insert-content capabilities. Share the supplied database with that integration using its Connections menu.
2. Confirm the database has one title property (the visitor's full name) and one Email property of type **Email**. The endpoint discovers their names. For an email stored in a text property, set `NOTION_EMAIL_PROPERTY` to its exact name. It never changes the schema.
3. From this directory, run `npx wrangler login`, then `npx wrangler secret put NOTION_KEY`. Enter the integration token at the secret prompt; never put it in the repository or frontend.
4. Check `ALLOWED_ORIGINS` in `wrangler.jsonc`. Its default is inferred from the existing GitHub remote: `https://janmm97.github.io`. Origins have no path or trailing slash. If using a custom domain, replace it or add another origin separated by a comma.
5. Run `npx wrangler deploy`. Copy the resulting Worker URL and append `/api/visitors`.
6. Paste that URL into `../../assets/js/visitor-config.js`, then publish the site to GitHub Pages.
7. Submit your own name/email once and confirm the corresponding row appears in Notion before inviting visitors.

The database ID is taken from the supplied link, not the `v=` view ID. If that link represents a page containing a linked database, set `NOTION_DATABASE_ID` to the actual source database ID. If it contains several data sources, set `NOTION_DATA_SOURCE_ID` explicitly. Authentication or schema errors keep the form closed and do not claim a successful save.

## Behavior

- Required full name and email; client and server validation, 4 KB request limit, honeypot and Cloudflare per-IP rate limiting.
- Only a confirmed Notion page creation, or a confirmed existing row for that email, returns `saved: true` and unlocks the portfolio.
- One row per email. Before creating a row the Worker queries the data source for the email (Notion's `equals` ignores case). A returning visitor on a new browser or device gets in without a second row. Both cases get the same `201` reply, so the endpoint does not reveal whether an email has visited before. Two simultaneous first submissions of the same email can still both be written.
- A successful introduction is remembered in that browser using a boolean in local storage, so returning visitors skip the form in new tabs and after restarting the browser. Where local storage is blocked, it falls back to session storage for the current tab. A different browser or device, a private window, or cleared site data asks again. No name or email is stored in browser storage.
- This is a visitor introduction gate, not content authentication. Static GitHub Pages assets remain public.
- Notion has no create-page idempotency guarantee, but the email lookup covers the common case: if a save times out after Notion wrote the row, the visitor's retry finds that row instead of adding another.
- No credentials, personal details or raw Notion errors are logged by the Worker.

## Local checks

Run `node --test worker.test.mjs`. These tests mock Notion; they do not create real visitor records.

## References

- [Notion data source API](https://developers.notion.com/reference/retrieve-a-data-source)
- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare rate limiting bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
