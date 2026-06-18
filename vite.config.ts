import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		// Exposes the build target to client code (currently informational; the
		// "/" → "/app" redirect for the app build is injected by
		// scripts/app-postbuild.mjs into the built index.html).
		__APP_BUILD__: JSON.stringify(process.env.BUILD_TARGET === 'app')
	}
});
