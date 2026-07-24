<script lang="ts">
	// Dependency-free "dotted globe" hero — pure 2D canvas, no WebGL, no libs.
	// Renders a sphere of land-ish dots plus the real story coordinates as glowing
	// points, and slowly auto-rotates. Colors come from CSS variables so it follows
	// the system light/dark scheme like the rest of the site.
	import { browser } from '$app/environment';

	interface Pt {
		lat: number;
		lng: number;
		tone?: string;
	}

	interface Props {
		points?: Pt[];
		height?: number;
		interactive?: boolean;
	}

	let { points = [], height = 260, interactive = true }: Props = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);

	// Read a CSS var off the canvas element (respects current theme).
	function cssVar(el: HTMLElement, name: string, fallback: string): string {
		const v = getComputedStyle(el).getPropertyValue(name).trim();
		return v || fallback;
	}

	// tone -> css var name
	const toneVar: Record<string, string> = {
		amber: '--color-amber',
		sage: '--color-sage',
		rose: '--color-rose',
		sky: '--color-sky'
	};

	$effect(() => {
		if (!browser || !canvas) return;
		const cv = canvas;
		const ctx = cv.getContext('2d');
		if (!ctx) return;

		let raf = 0;
		let rot = 0; // rotation in radians
		let dragging = false;
		let lastX = 0;
		let velocity = 0.0016; // idle spin speed
		let destroyed = false;

		// Pre-generate a fibonacci sphere of "background" dots for the land feel.
		const N = 1100;
		const sphere: { x: number; y: number; z: number }[] = [];
		const golden = Math.PI * (3 - Math.sqrt(5));
		for (let i = 0; i < N; i++) {
			const y = 1 - (i / (N - 1)) * 2;
			const r = Math.sqrt(1 - y * y);
			const theta = golden * i;
			sphere.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
		}

		// Convert story lat/lng to unit-sphere coords.
		function toSphere(lat: number, lng: number) {
			const phi = (90 - lat) * (Math.PI / 180);
			const th = (lng + 180) * (Math.PI / 180);
			return {
				x: -Math.sin(phi) * Math.cos(th),
				y: Math.cos(phi),
				z: Math.sin(phi) * Math.sin(th)
			};
		}
		const storyPts = points.map((p) => ({ ...toSphere(p.lat, p.lng), tone: p.tone }));

		function resize() {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const w = cv.clientWidth;
			const h = cv.clientHeight;
			cv.width = w * dpr;
			cv.height = h * dpr;
			ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
		}
		resize();
		window.addEventListener('resize', resize);

		function draw() {
			if (destroyed) return;
			const w = cv.clientWidth;
			const h = cv.clientHeight;
			const R = Math.min(w, h) / 2 - 6;
			const cx = w / 2;
			const cy = h / 2;

			const dotCol = cssVar(cv, '--color-faint', '#9a9087');
			const amber = cssVar(cv, '--color-amber', '#c87340');

			ctx!.clearRect(0, 0, w, h);

			const cosR = Math.cos(rot);
			const sinR = Math.sin(rot);
			// tilt
			const tilt = -0.35;
			const cosT = Math.cos(tilt);
			const sinT = Math.sin(tilt);

			function project(p: { x: number; y: number; z: number }) {
				// rotate around Y
				const x1 = p.x * cosR - p.z * sinR;
				const z1 = p.x * sinR + p.z * cosR;
				// tilt around X
				const y2 = p.y * cosT - z1 * sinT;
				const z2 = p.y * sinT + z1 * cosT;
				return { sx: cx + x1 * R, sy: cy + y2 * R, z: z2 };
			}

			// background land dots
			for (const p of sphere) {
				const { sx, sy, z } = project(p);
				if (z < -0.02) continue; // backface cull
				const depth = (z + 1) / 2;
				ctx!.globalAlpha = 0.12 + depth * 0.5;
				ctx!.fillStyle = dotCol;
				ctx!.beginPath();
				ctx!.arc(sx, sy, 0.7 + depth * 0.9, 0, Math.PI * 2);
				ctx!.fill();
			}

			// story points (glowing)
			for (const p of storyPts) {
				const { sx, sy, z } = project(p);
				if (z < -0.02) continue;
				const depth = (z + 1) / 2;
				const col = toneVar[p.tone ?? 'amber']
					? cssVar(cv, toneVar[p.tone ?? 'amber'], amber)
					: amber;
				// glow
				ctx!.globalAlpha = (0.18 + depth * 0.4);
				ctx!.fillStyle = col;
				ctx!.beginPath();
				ctx!.arc(sx, sy, 3.4 + depth * 2.2, 0, Math.PI * 2);
				ctx!.fill();
				// core
				ctx!.globalAlpha = 0.55 + depth * 0.45;
				ctx!.beginPath();
				ctx!.arc(sx, sy, 1.1 + depth * 1.1, 0, Math.PI * 2);
				ctx!.fill();
			}
			ctx!.globalAlpha = 1;

			rot += dragging ? 0 : velocity;
			raf = requestAnimationFrame(draw);
		}
		draw();

		// drag to spin
		function onDown(e: PointerEvent) {
			if (!interactive) return;
			dragging = true;
			lastX = e.clientX;
			cv.setPointerCapture(e.pointerId);
		}
		function onMove(e: PointerEvent) {
			if (!dragging) return;
			const dx = e.clientX - lastX;
			lastX = e.clientX;
			rot += dx * 0.006;
			velocity = dx * 0.0006 || velocity;
		}
		function onUp() {
			dragging = false;
			// clamp idle speed
			velocity = Math.max(-0.006, Math.min(0.006, velocity));
			if (Math.abs(velocity) < 0.0016) velocity = velocity < 0 ? -0.0016 : 0.0016;
		}
		if (interactive) {
			cv.addEventListener('pointerdown', onDown);
			window.addEventListener('pointermove', onMove);
			window.addEventListener('pointerup', onUp);
		}

		return () => {
			destroyed = true;
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
			if (interactive) {
				cv.removeEventListener('pointerdown', onDown);
				window.removeEventListener('pointermove', onMove);
				window.removeEventListener('pointerup', onUp);
			}
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="w-full block"
	style="height: {height}px; touch-action: none; cursor: {interactive ? 'grab' : 'default'};"
	aria-hidden="true"
></canvas>
