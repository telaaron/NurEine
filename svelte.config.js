import adapter from '@sveltejs/adapter-vercel';

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
		adapter: adapter({
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
