import { json } from '@sveltejs/kit';
import { verifyAdminLogin } from '$lib/server/queries';

export async function POST({ request, cookies }) {
  const { username, password } = await request.json();

  if (await verifyAdminLogin(username, password)) {
    cookies.set('admin_token', 'admin-authenticated', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    return json({ success: true });
  }

  return json({ success: false, error: 'Ungültige Anmeldedaten' }, { status: 401 });
}
