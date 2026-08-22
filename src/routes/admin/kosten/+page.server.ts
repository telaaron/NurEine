/**
 * /admin/kosten — vollständiges Kosten-Cockpit.
 *
 * Drei Ebenen:
 *   1. FIXKOSTEN   — Abos, die kein API-Key misst (Claude Code, Domain). Aaron-Eingabe.
 *   2. NUTZUNG     — gemessen aus DB + Live-APIs (fal-Bilder, ElevenLabs, Brevo …).
 *   3. GESAMT      — was seit Projektstart (13.05.2026) reingeflossen ist, +
 *                    Brennrate/Monat, + Stückkosten (was kostet 1 Story/Reel/Mail).
 *
 * Stückpreise sind benannte Konstanten (unten) — bei Preisänderung hier anpassen.
 */
import { env } from '$env/dynamic/private';
import { supabaseAdmin } from '$lib/server/supabase/client';

// ── Fixkosten (Aaron 2026-08, nicht per API messbar) ─────────────────────────
const FIX_CLAUDE_USD_MO = 100; // Claude Code / Max-Abo, übergreifend aber reale Ausgabe
const FIX_DOMAIN_EUR_YR = 10; // nureine.de
const USD_PER_EUR = 1.08; // grober Umrechnungskurs für die Gesamtsumme

// ── Stückpreise (Schätzwerte Stand 2026-08, bei Anbieter-Preisänderung anpassen) ─
// fal.ai: FLUX-pro ~$0,04/Bild (fetch), Seedream best-of-4 ~$0,16/Perle. Mischwert:
const FAL_USD_PER_IMAGE = 0.05;
const ELEVEN_USD_PER_1K_CHARS = 0.3; // ElevenLabs Creator-Tarif-Richtwert
const BREVO_FREE_DAILY = 300; // Free-Tier: 300 Mails/Tag → 0 € solange darunter

const PROJECT_START = '2026-05-13';
const TIMEOUT_MS = 10000;

function monthsSinceStart(): number {
	const start = new Date(PROJECT_START).getTime();
	return Math.max(1, (Date.now() - start) / (30.44 * 86400_000));
}

async function fetchFalBalance(): Promise<{ configured: boolean; balance: number | null; error: string | null }> {
	if (!env.FAL_KEY) return { configured: false, balance: null, error: null };
	try {
		const r = await fetch('https://api.fal.ai/v1/account/billing?expand=credits', {
			headers: { Authorization: `Key ${env.FAL_KEY}` },
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		if (r.status === 401 || r.status === 403) return { configured: true, balance: null, error: 'unauthorized' };
		if (!r.ok) return { configured: true, balance: null, error: 'error' };
		const j = (await r.json()) as { credits?: { current_balance?: number } };
		return { configured: true, balance: j.credits?.current_balance ?? null, error: null };
	} catch {
		return { configured: true, balance: null, error: 'error' };
	}
}

async function fetchElevenChars(): Promise<number | null> {
	if (!env.ELEVENLABS_API_KEY) return null;
	try {
		const start = Date.now() - 30 * 86400_000;
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

async function fetchBrevo(): Promise<{ configured: boolean; freeCredits: number | null; error: boolean }> {
	if (!env.BREVO_API_KEY) return { configured: false, freeCredits: null, error: false };
	try {
		const r = await fetch('https://api.brevo.com/v3/account', {
			headers: { 'api-key': env.BREVO_API_KEY, accept: 'application/json' },
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		if (!r.ok) return { configured: true, freeCredits: null, error: true };
		const j = (await r.json()) as { plan?: { type?: string; credits?: number }[] };
		const emailPlan = (j.plan ?? []).find((p) => p.type !== 'sms');
		return { configured: true, freeCredits: emailPlan?.credits ?? null, error: false };
	} catch {
		return { configured: true, freeCredits: null, error: true };
	}
}

const D30 = () => new Date(Date.now() - 30 * 86400_000).toISOString();

export async function load() {
	const [fal, elevenChars30d, brevo,
		imagesTotal, images30d, audioTotal, audio30d, reelsTotal, mailsTotal, mails30d] =
		await Promise.all([
			fetchFalBalance(),
			fetchElevenChars(),
			fetchBrevo(),
			supabaseAdmin.from('nureine_stories').select('id', { count: 'exact', head: true }).like('image_url', '%story_images%'),
			supabaseAdmin.from('nureine_stories').select('id', { count: 'exact', head: true }).like('image_url', '%story_images%').gte('created_at', D30()),
			supabaseAdmin.from('nureine_stories').select('id', { count: 'exact', head: true }).not('audio_url', 'is', null),
			supabaseAdmin.from('nureine_stories').select('id', { count: 'exact', head: true }).not('audio_url', 'is', null).gte('created_at', D30()),
			supabaseAdmin.from('nureine_stories').select('id', { count: 'exact', head: true }).not('tiktok_video_url', 'is', null),
			supabaseAdmin.from('nureine_newsletter_sends').select('id', { count: 'exact', head: true }),
			supabaseAdmin.from('nureine_newsletter_sends').select('id', { count: 'exact', head: true }).gte('sent_at', D30())
		]);

	const months = monthsSinceStart();
	const imgTot = imagesTotal.count ?? 0;
	const img30 = images30d.count ?? 0;
	const audTot = audioTotal.count ?? 0;
	const aud30 = audio30d.count ?? 0;
	const mailTot = mailsTotal.count ?? 0;
	const mail30 = mails30d.count ?? 0;

	const fixClaudeTotal = FIX_CLAUDE_USD_MO * months;
	const fixDomainTotal = FIX_DOMAIN_EUR_YR * USD_PER_EUR * (months / 12);
	const fixMonthly = FIX_CLAUDE_USD_MO + (FIX_DOMAIN_EUR_YR * USD_PER_EUR) / 12;

	const falTotal = imgTot * FAL_USD_PER_IMAGE;
	const fal30 = img30 * FAL_USD_PER_IMAGE;
	const elevenAvgChars = 600;
	const elevenTotalUsd = (audTot * elevenAvgChars / 1000) * ELEVEN_USD_PER_1K_CHARS;
	const eleven30Usd = (aud30 * elevenAvgChars / 1000) * ELEVEN_USD_PER_1K_CHARS;

	const totalInvested = fixClaudeTotal + fixDomainTotal + falTotal + elevenTotalUsd;
	const monthlyBurn = fixMonthly + fal30 + eleven30Usd;

	return {
		projectStart: PROJECT_START,
		months: Math.round(months * 10) / 10,
		services: [
			{
				key: 'claude', name: 'Claude Code', kind: 'Abo (fix)',
				monthly: FIX_CLAUDE_USD_MO, total: fixClaudeTotal,
				usage: `übergreifendes Max-Abo · ${Math.round(months)} Mon.`,
				live: null, note: 'Deine größte Position. Fix, egal wie viel NurEine läuft.'
			},
			{
				key: 'fal', name: 'fal.ai (Bilder)', kind: 'nach Nutzung',
				monthly: fal30, total: falTotal,
				usage: `${imgTot} Bilder gesamt · ${img30} in 30 Tagen`,
				live: fal.configured ? (fal.error ? 'Guthaben nur im fal-Dashboard' : fal.balance != null ? `$${fal.balance.toFixed(2)} Guthaben` : null) : 'nicht verbunden',
				note: `~$${FAL_USD_PER_IMAGE.toFixed(2)}/Bild. Größter variabler Hebel.`
			},
			{
				key: 'eleven', name: 'ElevenLabs (Audio)', kind: 'nach Nutzung',
				monthly: eleven30Usd, total: elevenTotalUsd,
				usage: `${audTot} vertonte Stories · ${elevenChars30d != null ? Math.round(elevenChars30d).toLocaleString('de-DE') + ' Zeichen/30 T.' : aud30 + ' in 30 T.'}`,
				live: env.ELEVENLABS_API_KEY ? null : 'nicht verbunden',
				note: `~$${ELEVEN_USD_PER_1K_CHARS}/1000 Zeichen. Nur ${audTot} Stories vertont — klein.`
			},
			{
				key: 'brevo', name: 'Brevo (E-Mail)', kind: 'Free-Tier',
				monthly: 0, total: 0,
				usage: `${mailTot} Mails gesamt · ${mail30} in 30 Tagen`,
				live: brevo.configured ? (brevo.freeCredits != null ? `${brevo.freeCredits.toLocaleString('de-DE')} Credits übrig` : null) : 'nicht verbunden',
				note: `${BREVO_FREE_DAILY}/Tag gratis. Bei ~${Math.round(mail30 / 30)} Mails/Tag: 0 €.`
			},
			{
				key: 'supabase', name: 'Supabase (DB+Storage)', kind: 'Free-Tier',
				monthly: 0, total: 0,
				usage: 'DB ~103 MB / 500 · Storage ~685 MB / 1 GB',
				live: 'Free (zurück von Pro)',
				note: 'Am 20.07. wegen Storage gesperrt → aufgeräumt. Nächster Engpass: Storage.'
			},
			{
				key: 'vercel', name: 'Vercel (Hosting)', kind: 'Free-Tier',
				monthly: 0, total: 0,
				usage: 'SvelteKit-Deploy + Serverless-Cron',
				live: 'Hobby (gratis)',
				note: '100 GB Bandbreite/Mon gratis. Kein Kostenrisiko bei eurer Größe.'
			},
			{
				key: 'domain', name: 'Domain nureine.de', kind: 'Abo (fix)',
				monthly: (FIX_DOMAIN_EUR_YR * USD_PER_EUR) / 12, total: fixDomainTotal,
				usage: `${FIX_DOMAIN_EUR_YR} €/Jahr`,
				live: null, note: 'Kleinster Posten.'
			},
			{
				key: 'reels', name: 'Reels/Video (Remotion)', kind: 'gratis (lokal)',
				monthly: 0, total: 0,
				usage: `${reelsTotal.count ?? 0} Reels gerendert`,
				live: 'Mac-Mini / lokal',
				note: 'Render lokal (nur Strom). edge-tts statt ElevenLabs = 0 €.'
			}
		],
		summary: {
			totalInvested,
			monthlyBurn,
			claudeShare: totalInvested ? Math.round((fixClaudeTotal / totalInvested) * 100) : 0
		},
		unit: {
			perImage: FAL_USD_PER_IMAGE,
			perStory: FAL_USD_PER_IMAGE, // ~1 Bild pro bebilderter Story
			perReel: 0,
			per1kMails: 0
		}
	};
}
