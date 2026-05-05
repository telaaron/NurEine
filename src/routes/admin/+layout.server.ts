import { redirect } from '@sveltejs/kit';

export function load({ cookies, url }) {
  const token = cookies.get('admin_token');
  if (token !== 'admin-authenticated' && !url.pathname.includes('/admin/login')) {
    throw redirect(302, '/sites/lichtblick/admin/login');
  }
}
