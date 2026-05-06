import { verifyAdminLogin } from '$lib/server/queries';
import { createHash } from 'crypto';

const SALT = 'lichtblick-salt-2024';

export function hashPassword(password: string): string {
	return createHash('sha256').update(password + SALT).digest('hex');
}

export async function verifyAdmin(username: string, password: string): Promise<boolean> {
	return await verifyAdminLogin(username, hashPassword(password));
}

export function validateSession(token: string): boolean {
	return token === 'admin-authenticated';
}
