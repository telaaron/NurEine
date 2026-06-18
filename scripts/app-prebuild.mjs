// Pre/post-build helper for the Capacitor app build.
//
// A static SPA has no server, so root-level +*.server.ts loads can't answer
// their __data.json requests — SvelteKit would fail with "Load failed" and the
// app renders an error. These files are needed by the website (Vercel) build,
// so we move them aside only while the app build runs, then restore them.
//
//   node scripts/app-prebuild.mjs stash    → move *.server.ts to *.server.ts.bak
//   node scripts/app-prebuild.mjs restore  → move them back
import { existsSync, renameSync } from 'node:fs';

const files = ['src/routes/+layout.server.ts', 'src/routes/+page.server.ts'];
const mode = process.argv[2];

for (const f of files) {
	const bak = `${f}.appbak`;
	if (mode === 'stash') {
		if (existsSync(f)) {
			renameSync(f, bak);
			console.log(`[app-prebuild] stashed ${f}`);
		}
	} else if (mode === 'restore') {
		if (existsSync(bak)) {
			renameSync(bak, f);
			console.log(`[app-prebuild] restored ${f}`);
		}
	}
}
