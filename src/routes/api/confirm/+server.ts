import { redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase/client';

// GET /api/confirm?token=xxx
// 1. Look up subscriber by confirmation_token
// 2. Set confirmed=true, clear confirmation_token
// 3. Redirect to /newsletter?confirmed=true

export async function GET({ url }) {
	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(303, '/newsletter?error=missing_token');
	}

	// 1. Look up subscriber by confirmation_token
	const { data: subscriber, error: lookupError } = await supabaseAdmin
		.from('nureine_subscribers')
		.select('id, email, confirmed')
		.eq('confirmation_token', token)
		.maybeSingle();

	if (lookupError) {
		console.error('Supabase lookup error:', lookupError);
		throw redirect(303, '/newsletter?error=server_error');
	}

	if (!subscriber) {
		// Token not found — might already be confirmed or invalid
		throw redirect(303, '/newsletter?error=invalid_token');
	}

	if (subscriber.confirmed) {
		// Already confirmed — just redirect with success
		throw redirect(303, '/newsletter?confirmed=true');
	}

	// 2. Set confirmed=true, clear confirmation_token
	const { error: updateError } = await supabaseAdmin
		.from('nureine_subscribers')
		.update({
			confirmed: true,
			confirmation_token: null
		})
		.eq('id', subscriber.id);

	if (updateError) {
		console.error('Supabase update error:', updateError);
		throw redirect(303, '/newsletter?error=server_error');
	}

	// 3. Redirect to /newsletter?confirmed=true
	throw redirect(303, '/newsletter?confirmed=true');
}
