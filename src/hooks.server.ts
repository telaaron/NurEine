import type { Handle, HandleServerError } from '@sveltejs/kit';

// ─── Rate Limiting (in-memory, per-IP sliding window) ────────────────────────
interface RateEntry {
	count: number;
	resetAt: number;
}

const rateLimit = new Map<string, RateEntry>();

// Clean up expired entries every 60 seconds
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of rateLimit) {
		if (entry.resetAt < now) rateLimit.delete(key);
	}
}, 60_000).unref();

function getRateLimitKey(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for');
	const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1';
	return `${ip}:${new URL(request.url).pathname}`;
}

// Per-route rate limits
const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
	'/api/subscribe': { max: 5, windowMs: 60_000 },        // 5 req/min
	'/api/auth/login': { max: 10, windowMs: 60_000 },       // 10 req/min
	'/api/newsletter/test': { max: 3, windowMs: 60_000 },   // 3 req/min
};

// ─── Server Hook: Rate-Limiting + CSRF Origin Check ─────────────────────────
export const handle: Handle = async ({ event, resolve }) => {
	const { request, url } = event;
	const pathname = url.pathname;

	// Rate-limit protected API routes
	if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
		const limit = RATE_LIMITS[pathname];
		if (limit) {
			const key = getRateLimitKey(request);
			const now = Date.now();
			let entry = rateLimit.get(key);

			if (!entry || entry.resetAt < now) {
				entry = { count: 0, resetAt: now + limit.windowMs };
				rateLimit.set(key, entry);
			}

			entry.count++;

			if (entry.count > limit.max) {
				return new Response(
					JSON.stringify({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' }),
					{
						status: 429,
						headers: {
							'Content-Type': 'application/json',
							'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000))
						}
					}
				);
			}
		}
	}

	// CSRF: Check Origin header on state-changing requests to API routes
	if ((request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') && pathname.startsWith('/api/')) {
		const origin = request.headers.get('origin');
		// Allow same-origin and null (server-to-server, mobile apps)
		if (origin && origin !== url.origin) {
			return new Response(
				JSON.stringify({ error: 'Cross-Origin-Anfragen sind nicht erlaubt.' }),
				{ status: 403, headers: { 'Content-Type': 'application/json' } }
			);
		}
	}

	return resolve(event);
};

// ─── Global Error Handler ───────────────────────────────────────────────────
export const handleError: HandleServerError = async ({ error, status, message }) => {
	const err = error as Error & { code?: string };

	// Only log server errors, not 4xx
	if (status && status >= 500) {
		console.error('[NurEine Error]', {
			message: err.message || message,
			stack: err.stack?.split('\n').slice(0, 4).join('\n'),
			code: err.code,
			status
		});
	}

	return {
		message: status && status < 500
			? message
			: 'Ein interner Fehler ist aufgetreten. Wir wurden benachrichtigt.'
	};
};
