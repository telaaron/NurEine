# NurEine Newsletter Cron Worker

A minimal Cloudflare Worker that triggers the daily newsletter run.

It does **nothing** itself except POST to `TARGET_URL` once per day with a
shared bearer token. All actual sending logic lives in the SvelteKit repo at
`src/lib/server/newsletter.ts` and `src/routes/api/cron/newsletter/+server.ts`.

## Setup (one-time)

```bash
cd workers/newsletter-cron
pnpm install                   # or npm install / yarn

# Login & pick the right account
npx wrangler login

# Push the shared secret (must match CRON_SECRET in Vercel)
npx wrangler secret put CRON_SECRET

# Deploy
npx wrangler deploy
```

## Configuration

- **Cron schedule**: `wrangler.toml` → `[triggers] crons = ["20 4 * * *"]`
  (04:20 UTC = 06:20 CEST, matching the old GitHub Actions schedule).
- **Target URL**: `wrangler.toml` → `[vars] TARGET_URL`. Change for staging.
- **Secret**: `CRON_SECRET` — never commit, set via `wrangler secret put`.

## Manual trigger

```bash
# Smoke-test the deployed Worker
curl https://nureine-newsletter-cron.<account>.workers.dev/run \
  -H "Authorization: Bearer $CRON_SECRET"

# Or trigger the cron locally
pnpm run dev
# then in another shell:
curl "http://localhost:8787/__scheduled?cron=20+4+*+*+*"
```

## Logs

```bash
npx wrangler tail
```

## Editing the newsletter content / logic

You don't touch this Worker. Edit the SvelteKit app:

- `src/lib/server/newsletter.ts` — HTML templates, B2C/B2B logic, Brevo calls
- `src/routes/api/cron/newsletter/+server.ts` — entry endpoint + auth gate

Then `git push` — Vercel deploys automatically. Worker schedule stays the same.
