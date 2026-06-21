import { supabaseAdmin } from '$lib/server/supabase/client';
import { REFERRAL_TIERS } from '$lib/referralTiers';

export const prerender = false;

// Öffentliche Würdigung: Menschen, die NurEine durch Weiterempfehlung mittragen.
// Datenschutz: nur Vorname/Anzeigename (kein Mail, keine Zählung pro Person
// öffentlich), nur wer einen Namen hinterlegt hat und die Mitwirkenden-Schwelle
// erreicht. Wer keinen Namen hat, erscheint nicht — kein Zwang, keine Bloßstellung.
const CONTRIBUTOR_THRESHOLD = REFERRAL_TIERS[REFERRAL_TIERS.length - 1].count;

export async function load() {
	const { data } = await supabaseAdmin
		.from('nureine_subscribers')
		.select('name, referral_count')
		.gte('referral_count', CONTRIBUTOR_THRESHOLD)
		.not('name', 'is', null)
		.order('referral_count', { ascending: false });

	const rows = (data as { name: string | null; referral_count: number }[]) ?? [];
	const contributors = rows
		.map((r) => (r.name ?? '').trim().split(/\s+/)[0]) // nur Vorname
		.filter((n) => n.length > 0);

	return { contributors, threshold: CONTRIBUTOR_THRESHOLD };
}
