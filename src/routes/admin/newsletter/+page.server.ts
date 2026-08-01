/**
 * /admin/newsletter — Öffnungs- & Klick-Auswertung des täglichen Newsletters.
 *
 * Quellen:
 *   nureine_newsletter_sends   — 1 Zeile pro Empfänger×Versand, opened bool (Brevo-Webhook)
 *   nureine_newsletter_clicks  — 1 Zeile pro Story-Klick über /r (seit 2026-07-25)
 *
 * Pro Kalendertag: versendet, geöffnet (Rate), geklickt (Rate). B2B-Sends
 * (b2b_client_id gesetzt) werden ausgeklammert — hier zählt nur der B2C-Newsletter.
 */
import { supabaseAdmin } from '$lib/server/supabase/client';
import type { PageServerLoad } from './$types';

const DAYS = 30;

interface DayRow {
	day: string;
	sent: number;
	opened: number;
	clicked: number;
	openRate: number;
	clickRate: number;
}

export const load: PageServerLoad = async () => {
	const since = new Date(Date.now() - DAYS * 86400_000).toISOString();

	// Sends (B2C only) der letzten 30 Tage.
	const { data: sends } = await supabaseAdmin
		.from('nureine_newsletter_sends')
		.select('sent_at, opened, b2b_client_id')
		.gte('sent_at', since)
		.is('b2b_client_id', null);

	// Klicks der letzten 30 Tage.
	const { data: clicks } = await supabaseAdmin
		.from('nureine_newsletter_clicks')
		.select('day')
		.gte('day', since.slice(0, 10));

	// Nach Berlin-Tag gruppieren (Sends kommen als UTC-Timestamp).
	const byDay = new Map<string, { sent: number; opened: number; clicked: number }>();
	const get = (d: string) => {
		let e = byDay.get(d);
		if (!e) { e = { sent: 0, opened: 0, clicked: 0 }; byDay.set(d, e); }
		return e;
	};
	const berlinDay = (iso: string) =>
		new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }); // YYYY-MM-DD

	for (const s of sends ?? []) {
		const e = get(berlinDay(s.sent_at as string));
		e.sent += 1;
		if (s.opened) e.opened += 1;
	}
	for (const c of clicks ?? []) {
		get(c.day as string).clicked += 1;
	}

	const rows: DayRow[] = [...byDay.entries()]
		.map(([day, v]) => ({
			day,
			sent: v.sent,
			opened: v.opened,
			clicked: v.clicked,
			openRate: v.sent ? Math.round((v.opened / v.sent) * 100) : 0,
			// Klickrate relativ zu den Versendeten (CTR), nicht zu den Öffnern.
			clickRate: v.sent ? Math.round((v.clicked / v.sent) * 100) : 0
		}))
		.sort((a, b) => b.day.localeCompare(a.day));

	// Gesamt-Kennzahlen über den Zeitraum.
	const totSent = rows.reduce((n, r) => n + r.sent, 0);
	const totOpen = rows.reduce((n, r) => n + r.opened, 0);
	const totClick = rows.reduce((n, r) => n + r.clicked, 0);

	return {
		rows,
		summary: {
			days: rows.length,
			sent: totSent,
			opened: totOpen,
			clicked: totClick,
			openRate: totSent ? Math.round((totOpen / totSent) * 100) : 0,
			clickRate: totSent ? Math.round((totClick / totSent) * 100) : 0
		}
	};
};
