import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		// Exposes the build target to client code so the root route can redirect
		// into the app shell (/app) when this is the Capacitor build.
		__APP_BUILD__: JSON.stringify(process.env.BUILD_TARGET === 'app')
	}
});
