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

	import { track } from '$lib/track';
	import Icon from '$lib/components/Icon.svelte';
	import { ChatBubbleLeftRightIcon, CheckIcon, ClipboardIcon, EnvelopeIcon, ShareIcon } from 'heroicons-svelte/24/outline';

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
		track('share', { method: 'native', url: shareUrl });
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
		track('share', { method: 'copy', url: shareUrl });
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
		<Icon icon={ShareIcon} label="Teilen" />
	</button>

	<button type="button" class="share-btn" onclick={copyLink} aria-label="Link kopieren" title="Link kopieren">
		{#if copied}
			<Icon icon={CheckIcon} label="Kopiert" style="color: var(--color-sage)" />
		{:else}
			<Icon icon={ClipboardIcon} label="Link kopieren" />
		{/if}
	</button>

	<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onclick={() => track('share', { method: 'whatsapp', url: shareUrl })} class="share-btn" aria-label="Auf WhatsApp teilen" title="WhatsApp">
		<Icon icon={ChatBubbleLeftRightIcon} label="WhatsApp" />
	</a>

	<a href={xUrl} target="_blank" rel="noopener noreferrer" onclick={() => track('share', { method: 'x', url: shareUrl })} class="share-btn" aria-label="Auf X teilen" title="X">
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M4 4l11.733 16h4.267l-11.733 -16z" />
			<path d="M4 20l6.768 -6.768" />
			<path d="M14.667 8.667L20 4" />
		</svg>
	</a>

	<a href={emailUrl} onclick={() => track('share', { method: 'email', url: shareUrl })} class="share-btn" aria-label="Per E-Mail teilen" title="E-Mail">
		<Icon icon={EnvelopeIcon} label="E-Mail" />
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
