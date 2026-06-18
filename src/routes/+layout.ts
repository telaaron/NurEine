import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';

declare const __APP_BUILD__: boolean;

// In the Capacitor app build the webview opens at "/", which is the website
// homepage (server-loaded → blank in a static webview). Redirect into the app
// shell. The website (Vercel) build leaves __APP_BUILD__ false, so this is a
// no-op there and the homepage renders normally.
export const load = ({ url }) => {
	if (__APP_BUILD__) {
		const path = url.pathname.replace(base, '') || '/';
		if (path === '/' || path === '') {
			throw redirect(307, `${base}/app`);
		}
	}
	return {};
};
