# Visitor registration: GitHub Pages → Worker → Notion

The portfolio stays static on GitHub Pages. Deploy this endpoint separately to Cloudflare Workers. It stores names and emails in the supplied Notion database. The live database schema and permissions have not been verified: no token or connected Notion API was available during implementation.

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
- Only a confirmed Notion page creation returns `saved: true` and unlocks the portfolio.
- A successful introduction is remembered for the current browser tab using a boolean in session storage. No name or email is stored in browser storage.
- This is a visitor introduction gate, not content authentication. Static GitHub Pages assets remain public.
- Notion has no create-page idempotency guarantee here. A timeout after a successful remote write can cause a duplicate if the visitor retries. No email-based lookup or visitor-record existence is exposed.
- No credentials, personal details or raw Notion errors are logged by the Worker.

## Local checks

Run `node --test worker.test.mjs`. These tests mock Notion; they do not create real visitor records.

## References

- [Notion data source API](https://developers.notion.com/reference/retrieve-a-data-source)
- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare rate limiting bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
