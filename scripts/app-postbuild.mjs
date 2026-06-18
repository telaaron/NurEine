// Post-build step for the Capacitor app build only.
//
// Injects a tiny, idempotent redirect into build-app/index.html so the webview's
// initial "/" bounces to "/app" before SvelteKit boots. The static adapter
// serves this index.html for every route (SPA fallback), so the guard
// `indexOf('/app') !== 0` keeps it from looping once we're inside the app shell.
// This avoids mounting the server-loaded website homepage inside the static
// webview (which renders blank).
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'build-app/index.html';
const html = readFileSync(file, 'utf8');

const marker = "location.replace('/app')";
if (html.includes(marker)) {
	console.log('[app-postbuild] redirect already present');
} else {
	const script =
		`<script>(function(){var p=location.pathname;if(p.indexOf('/app')!==0){location.replace('/app');}})();</script>`;
	writeFileSync(file, html.replace('</head>', `${script}</head>`));
	console.log('[app-postbuild] injected /app redirect into index.html');
}
