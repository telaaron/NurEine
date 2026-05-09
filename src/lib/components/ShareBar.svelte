<script lang="ts">
	/**
	 * ShareBar — Sanfte Sharing-Komponente, die zum editorialen Ton von NurEine passt.
	 *
	 * Props:
	 *   url        — zu teilende URL (optional, default: window.location.href)
	 *   title      — Titel für Web Share API / WhatsApp / Email
	 *   text       — Beschreibung für Web Share API / Email-Body
	 *   showLabel  — "Teilen"-Label vor den Icons anzeigen (default: false)
	 *   size       — Icon-Größe in px (default: 18)
	 *
	 * Nutzt Web Share API wo verfügbar (Mobile), mit Fallbacks für Desktop.
	 */

	type Props = {
		url?: string;
		title: string;
		text?: string;
		showLabel?: boolean;
		size?: number;
	};

	let { url, title, text = '', showLabel = false, size = 18 }: Props = $props();

	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout>;

	const shareUrl = $derived(url || (typeof window !== 'undefined' ? window.location.href : ''));
	const encodedUrl = $derived(encodeURIComponent(shareUrl));
	const encodedTitle = $derived(encodeURIComponent(title));
	const encodedText = $derived(encodeURIComponent(text));

	const whatsappUrl = $derived(`https://wa.me/?text=${encodedTitle}%20%E2%80%94%20${encodedText}%20${encodedUrl}`);
	const emailUrl = $derived(`mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`);
	const xUrl = $derived(`https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`);

	async function share() {
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({ title, text, url: shareUrl });
			} catch {
				// User cancelled or error — no action needed
			}
		} else {
			copyLink();
		}
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => (copied = false), 2000);
		} catch {
			// Clipboard API not available — ignore gracefully
		}
	}
</script>

<div class="share-bar" class:has-label={showLabel}>
	{#if showLabel}
		<span class="share-label meta">Teilen</span>
	{/if}

	<button type="button" class="share-btn" onclick={share} aria-label="Teilen" title="Teilen">
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="18" cy="5" r="3" />
			<circle cx="6" cy="12" r="3" />
			<circle cx="18" cy="19" r="3" />
			<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
			<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
		</svg>
	</button>

	<button type="button" class="share-btn" onclick={copyLink} aria-label="Link kopieren" title="Link kopieren">
		{#if copied}
			<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="20 6 9 17 4 12" />
			</svg>
		{:else}
			<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
				<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
			</svg>
		{/if}
	</button>

	<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" class="share-btn" aria-label="Auf WhatsApp teilen" title="WhatsApp">
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
		</svg>
	</a>

	<a href={xUrl} target="_blank" rel="noopener noreferrer" class="share-btn" aria-label="Auf X teilen" title="X">
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M4 4l11.733 16h4.267l-11.733 -16z" />
			<path d="M4 20l6.768 -6.768" />
			<path d="M14.667 8.667L20 4" />
		</svg>
	</a>

	<a href={emailUrl} class="share-btn" aria-label="Per E-Mail teilen" title="E-Mail">
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
			<polyline points="22,6 12,13 2,6" />
		</svg>
	</a>
</div>

<style>
	.share-bar {
		display: inline-flex;
		align-items: center;
		gap: 1px;
	}

	.share-bar.has-label {
		gap: 8px;
	}

	.share-label {
		color: var(--color-muted);
	}

	.share-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: transparent;
		color: var(--color-muted);
		cursor: pointer;
		border-radius: 6px;
		transition: color 0.2s, background 0.2s;
		text-decoration: none;
	}

	.share-btn:hover {
		color: var(--color-amber);
		background: var(--color-amber-tint);
	}

	.share-btn:active {
		transform: scale(0.92);
	}
</style>
