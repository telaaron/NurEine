import type { CapacitorConfig } from '@capacitor/cli';

// NurEine iOS app — Capacitor shell over the static SvelteKit build (build-app/).
// The app ships only the /app/* routes (client-rendered) and fetches data from
// the live production API at nureine.de. The website build (Vercel) is untouched.
const config: CapacitorConfig = {
	appId: 'de.nureine.app',
	appName: 'NurEine',
	webDir: 'build-app',
	ios: {
		// Warm paper canvas behind the webview during load — no white flash.
		backgroundColor: '#f5f1ea',
		contentInset: 'always'
	},
	plugins: {
		SplashScreen: {
			launchShowDuration: 600,
			backgroundColor: '#f5f1ea',
			showSpinner: false
		},
		PushNotifications: {
			// Foreground presentation: show the morning push even with app open.
			presentationOptions: ['badge', 'sound', 'alert']
		}
	}
};

export default config;
