import type { CapacitorConfig } from '@capacitor/cli';

// NurEine iOS app — Capacitor shell over the static SvelteKit build (build-app/).
// The app ships only the /app/* routes (client-rendered) and fetches data from
// the live production API at nureine.de. The website build (Vercel) is untouched.
const config: CapacitorConfig = {
	appId: 'de.nureine.app',
	appName: 'NurEine',
	webDir: 'build-app',
	ios: {
		// No fixed background — the webview is transparent and the page's own
		// html/body background (light canvas or warm dark) fills every edge,
		// including under the status bar and home indicator.
		backgroundColor: '#00000000',
		contentInset: 'never'
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
