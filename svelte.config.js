import vercelAdapter from '@sveltejs/adapter-vercel';
import staticAdapter from '@sveltejs/adapter-static';

// Dual-target build:
//   BUILD_TARGET=app  → static SPA for the Capacitor iOS app (adapter-static,
//                       SPA fallback, output in build-app/). Only the /app/*
//                       routes are shipped; everything client-rendered, data
//                       fetched from the live nureine.de API.
//   default (web)     → unchanged Vercel SSR build. The website is untouched.
const isApp = process.env.BUILD_TARGET === 'app';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		paths: {
			base: ''
		},
		adapter: isApp
			? staticAdapter({
					// SPA mode: every route resolves to fallback.html, the app shell
					// boots client-side. No server, no prerender of SSR pages.
					fallback: 'index.html',
					pages: 'build-app',
					assets: 'build-app',
					strict: false
				})
			: vercelAdapter({
					runtime: 'nodejs22.x'
				}),
		prerender: {
			crawl: false,
			entries: [],
			handleHttpError: 'warn',
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;
