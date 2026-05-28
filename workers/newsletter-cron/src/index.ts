/**
 * NurEine Newsletter Cron Worker
 *
 * Cloudflare Worker that fires once a day (configured in wrangler.toml) and
 * POSTs to the SvelteKit /api/cron/newsletter endpoint. All actual sending
 * logic lives in the SvelteKit app — this Worker is intentionally tiny.
 *
 * Required bindings:
 *   - TARGET_URL  (vars)    public URL of the cron endpoint
 *   - CRON_SECRET (secret)  shared bearer token
 *
 * Manual run (smoke test):
 *   curl https://<worker-subdomain>.workers.dev/run \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */

export interface Env {
  TARGET_URL: string;
  CRON_SECRET: string;
}

async function trigger(env: Env): Promise<Response> {
  const start = Date.now();
  console.log(`[cron] POST ${env.TARGET_URL}`);

  const resp = await fetch(env.TARGET_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
      'Content-Type': 'application/json'
    },
    body: '{}'
  });

  const text = await resp.text();
  const durationMs = Date.now() - start;
  console.log(`[cron] ${resp.status} in ${durationMs}ms — ${text.slice(0, 500)}`);

  if (!resp.ok) {
    throw new Error(`Upstream ${resp.status}: ${text.slice(0, 300)}`);
  }
  return new Response(text, {
    status: resp.status,
    headers: { 'Content-Type': resp.headers.get('Content-Type') || 'application/json' }
  });
}

export default {
  // Scheduled cron trigger (production path).
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      trigger(env).catch((err) => {
        console.error('[cron] scheduled run failed:', err);
        throw err;
      })
    );
  },

  // Manual fetch handler (kept small — only /run, and only with the secret).
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/run') {
      return new Response('Not found', { status: 404 });
    }
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
    try {
      return await trigger(env);
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
