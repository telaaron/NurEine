import { env } from '$env/dynamic/private';
import { supabaseAdmin } from '$lib/server/supabase/client';

// Stückpreise — Schätzwerte Stand 2026-06, bei Preisänderung der Anbieter anpassen.
// FLUX.1 [pro]: $0.05/Megapixel × 0,79 MP (landscape_4_3, 1024×768).
const FLUX_PRO_USD_PER_IMAGE = 0.04;
// DeepSeek-Chat Scoring-Call: ~2,5k Input- + ~0,5k Output-Tokens.
const DEEPSEEK_USD_PER_CALL = 0.001;

const TIMEOUT_MS = 10000;

interface DeepseekBalanceInfo {
	currency: string;
	total_balance: string;
	granted_balance: string;
	topped_up_balance: string;
}

export interface DeepseekData {
	configured: boolean;
	available: boolean;
	balances: { currency: string; total: number; granted: number; toppedUp: number }[];
	error: boolean;
}

export interface FalData {
	configured: boolean;
	balance: number | null;
	currency: string;
	// 'unauthorized' = Key hat keine Admin-/Account-Scope → Balance nur im fal-Dashboard sichtbar.
	error: 'unauthorized' | 'error' | null;
}

export interface BrevoData {
	configured: boolean;
	plans: { type: string; credits: number; creditsType: string }[];
	stats: { requests: number; delivered: number; uniqueOpens: number; hardBounces: number } | null;
	error: boolean;
}

async function fetchDeepseek(): Promise<DeepseekData> {
	if (!env.DEEPSEEK_API_KEY) return { configured: false, available: false, balances: [], error: false };
	try {
		const r = await fetch('https://api.deepseek.com/user/balance', {
			headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		if (!r.ok) return { configured: true, available: false, balances: [], error: true };
		const j = (await r.json()) as { is_available?: boolean; balance_infos?: DeepseekBalanceInfo[] };
		return {
			configured: true,
			available: j.is_available ?? false,
			balances: (j.balance_infos ?? []).map((b) => ({
				currency: b.currency,
				total: parseFloat(b.total_balance) || 0,
				granted: parseFloat(b.granted_balance) || 0,
				toppedUp: parseFloat(b.topped_up_balance) || 0
			})),
			error: false
		};
	} catch {
		return { configured: true, available: false, balances: [], error: true };
	}
}

async function fetchFal(): Promise<FalData> {
	if (!env.FAL_KEY) return { configured: false, balance: null, currency: 'USD', error: null };
	try {
		const r = await fetch('https://api.fal.ai/v1/account/billing?expand=credits', {
			headers: { Authorization: `Key ${env.FAL_KEY}` },
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		if (r.status === 401 || r.status === 403) {
			return { configured: true, balance: null, currency: 'USD', error: 'unauthorized' };
		}
		if (!r.ok) return { configured: true, balance: null, currency: 'USD', error: 'error' };
		const j = (await r.json()) as { credits?: { current_balance?: number; currency?: string } };
		return {
			configured: true,
			balance: j.credits?.current_balance ?? null,
			currency: j.credits?.currency ?? 'USD',
			error: null
		};
	} catch {
		return { configured: true, balance: null, currency: 'USD', error: 'error' };
	}
}

async function fetchBrevo(): Promise<BrevoData> {
	if (!env.BREVO_API_KEY) return { configured: false, plans: [], stats: null, error: false };
	const headers = { 'api-key': env.BREVO_API_KEY, accept: 'application/json' };
	try {
		const [accountRes, statsRes] = await Promise.all([
			fetch('https://api.brevo.com/v3/account', { headers, signal: AbortSignal.timeout(TIMEOUT_MS) }),
			fetch('https://api.brevo.com/v3/smtp/statistics/aggregatedReport?days=30', {
				headers,
				signal: AbortSignal.timeout(TIMEOUT_MS)
			})
		]);
		let plans: BrevoData['plans'] = [];
		if (accountRes.ok) {
			const j = (await accountRes.json()) as {
				plan?: { type?: string; credits?: number; creditsType?: string }[];
			};
			plans = (j.plan ?? [])
				// SMS-Kontingent ist für NurEine irrelevant — nur E-Mail-Pläne zeigen.
				.filter((p) => p.type !== 'sms')
				.map((p) => ({
					type: p.type ?? '—',
					credits: p.credits ?? 0,
					creditsType: p.creditsType ?? '—'
				}));
		}
		let stats: BrevoData['stats'] = null;
		if (statsRes.ok) {
			const s = (await statsRes.json()) as {
				requests?: number;
				delivered?: number;
				uniqueOpens?: number;
				hardBounces?: number;
			};
			stats = {
				requests: s.requests ?? 0,
				delivered: s.delivered ?? 0,
				uniqueOpens: s.uniqueOpens ?? 0,
				hardBounces: s.hardBounces ?? 0
			};
		}
		return { configured: true, plans, stats, error: !accountRes.ok && !statsRes.ok };
	} catch {
		return { configured: true, plans: [], stats: null, error: true };
	}
}

async function fetchElevenLabsChars(): Promise<number | null> {
	if (!env.ELEVENLABS_API_KEY) return null;
	try {
		const start = Date.now() - 30 * 24 * 60 * 60 * 1000;
		const r = await fetch(
			`https://api.elevenlabs.io/v1/usage/character-stats?start_unix=${start}&end_unix=${Date.now()}`,
			{ headers: { 'xi-api-key': env.ELEVENLABS_API_KEY }, signal: AbortSignal.timeout(TIMEOUT_MS) }
		);
		if (!r.ok) return null;
		const j = (await r.json()) as { time?: number[]; usage?: Record<string, number[]> };
		const times = j.time ?? [];
		const series = Object.values(j.usage ?? {});
		return times.reduce((sum, _, i) => sum + series.reduce((s, arr) => s + (arr[i] ?? 0), 0), 0);
	} catch {
		return null;
	}
}

// Kosten-Cockpit: Guthaben der Dienste (Live-APIs) + Nutzung 30 Tage aus eigenen Logs
// + grobe Kosten-Schätzung (Stückpreis-Konstanten oben).
export async function load() {
	const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

	const countFetchLog = (decision: string) =>
		supabaseAdmin
			.from('nureine_fetch_log')
			.select('id', { count: 'exact', head: true })
			.eq('decision', decision)
			.gte('ran_at', since30d);

	const [deepseek, fal, brevo, elevenChars, imagesRes, storiesRes, acceptedRes, rejectedAiRes] =
		await Promise.all([
			fetchDeepseek(),
			fetchFal(),
			fetchBrevo(),
			fetchElevenLabsChars(),
			supabaseAdmin
				.from('nureine_stories')
				.select('id', { count: 'exact', head: true })
				.not('image_url', 'is', null)
				.gte('created_at', since30d),
			supabaseAdmin
				.from('nureine_stories')
				.select('id', { count: 'exact', head: true })
				.gte('created_at', since30d),
			countFetchLog('accepted'),
			countFetchLog('rejected_ai')
		]);

	const images30d = imagesRes.count ?? 0;
	const stories30d = storiesRes.count ?? 0;
	// Jeder accepted/rejected_ai-Eintrag = 1 DeepSeek-Scoring-Call (Prefilter-Rejects kosten nichts).
	// Nicht erfasst: Rescore-/Backfill-Skripte — Schätzung ist Untergrenze.
	const deepseekCalls30d = (acceptedRes.count ?? 0) + (rejectedAiRes.count ?? 0);

	const estFalUsd = images30d * FLUX_PRO_USD_PER_IMAGE;
	const estDeepseekUsd = deepseekCalls30d * DEEPSEEK_USD_PER_CALL;

	return {
		deepseek,
		fal,
		brevo,
		elevenChars,
		elevenConfigured: !!env.ELEVENLABS_API_KEY,
		usage30d: {
			images: images30d,
			stories: stories30d,
			deepseekCalls: deepseekCalls30d,
			accepted: acceptedRes.count ?? 0,
			rejectedAi: rejectedAiRes.count ?? 0
		},
		est: {
			falUsd: estFalUsd,
			deepseekUsd: estDeepseekUsd,
			totalUsd: estFalUsd + estDeepseekUsd,
			falPerImage: FLUX_PRO_USD_PER_IMAGE,
			deepseekPerCall: DEEPSEEK_USD_PER_CALL
		}
	};
}
