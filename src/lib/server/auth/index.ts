import { verifyAdminLogin } from '$lib/server/queries';

export async function verifyAdmin(username: string, password: string): Promise<boolean> {
	return await verifyAdminLogin(username, password);
}

export function validateSession(token: string): boolean {
	return token === 'admin-authenticated';
}
