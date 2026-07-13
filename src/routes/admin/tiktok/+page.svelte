<script lang="ts">
	import { enhance } from '$app/forms';
	import { base } from '$app/paths';

	let { data } = $props();

	// Welche Card hat gerade „kopiert!"-Feedback (per Feld-Key).
	let copiedKey = $state<string | null>(null);
	async function copy(text: string, key: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedKey = key;
			setTimeout(() => { if (copiedKey === key) copiedKey = null; }, 1600);
		} catch {
			copiedKey = 'FEHLER:' + key;
			setTimeout(() => { if (copiedKey === 'FEHLER:' + key) copiedKey = null; }, 1600);
		}
	}

	// Offene zuerst (die noch nicht auf TikTok sind), dann erledigte.
	const sorted = $derived([...data.cards].sort((a, b) => Number(a.tiktokPosted) - Number(b.tiktokPosted)));

	function catLabel(c: string | null): string {
		return c ? c.charAt(0).toUpperCase() + c.slice(1) : '—';
	}
</script>

<svelte:head><title>TikTok — NurEine Cockpit</title></svelte:head>

<div class="mb-8">
	<div class="flex items-center gap-2 mb-1">
		<h1 class="display text-2xl" style="color: var(--color-ink); font-weight: 600;">TikTok</h1>
		<span class="text-[0.6rem] uppercase tracking-[0.16em] px-2 py-0.5 rounded-full"
			style="font-family: var(--font-mono); background: var(--color-amber-tint, rgba(200,150,40,0.12)); color: var(--color-amber);">manuell</span>
	</div>
	<p class="text-sm max-w-2xl" style="color: var(--color-ink-soft);">
		Jeden Tag baut die Reel-Regie einen eigenen <strong>TikTok-Master</strong> (Beweis-Loop, Wachstums-Archiv).
		Lade das Video herunter, kopiere Caption + Hashtags, poste in der TikTok-App — dann hier abhaken.
		Cover = der „Belegt."-Stempel-Moment · das „KI-generiert"-Label anschalten.
	</p>
	<div class="flex gap-4 mt-4 text-sm" style="color: var(--color-ink-soft);">
		<span><strong style="color: var(--color-ink);">{data.stats.total}</strong> Reels</span>
		<span><strong style="color: var(--color-amber);">{data.stats.open}</strong> offen</span>
		<span><strong style="color: var(--color-sage, #5a8f6f);">{data.stats.posted}</strong> gepostet</span>
	</div>
</div>

{#if !data.cards.length}
	<div class="rounded-xl p-8 text-center text-sm" style="background: var(--color-paper); color: var(--color-faint); border: 1px solid var(--color-rule);">
		Noch keine Reels vorhanden. Sobald die Reel-Regie-Routine welche produziert, erscheinen sie hier.
	</div>
{/if}

<div class="flex flex-col gap-4">
	{#each sorted as card (card.postId)}
		<div class="rounded-xl overflow-hidden" style="background: var(--color-paper); border: 1px solid var(--color-rule); {card.tiktokPosted ? 'opacity: 0.72;' : ''}">
			<div class="flex flex-col sm:flex-row gap-0">
				<!-- Video-Vorschau / Thumbnail -->
				<div class="sm:w-[168px] shrink-0 relative" style="background: var(--color-canvas-soft);">
					{#if card.videoUrl}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video src={card.videoUrl} poster={card.imageUrl ?? undefined} controls preload="metadata"
							class="w-full h-full object-cover" style="aspect-ratio: 9/16; max-height: 300px;"></video>
					{:else if card.imageUrl}
						<img src={card.imageUrl} alt="" class="w-full object-cover" style="aspect-ratio: 9/16; max-height: 300px;" />
					{:else}
						<div class="w-full flex items-center justify-center text-xs" style="aspect-ratio: 9/16; color: var(--color-faint);">kein Video</div>
					{/if}
				</div>

				<!-- Inhalt -->
				<div class="flex-1 min-w-0 p-4 sm:p-5">
					<div class="flex items-start gap-2 mb-2">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap mb-0.5">
								<span class="text-[0.62rem] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded" style="font-family: var(--font-mono); background: var(--color-canvas-soft); color: var(--color-ink-soft);">{catLabel(card.category)}</span>
								{#if card.impactScore != null}
									<span class="text-[0.62rem]" style="font-family: var(--font-mono); color: var(--color-faint);">Impact {card.impactScore}</span>
								{/if}
								{#if card.tiktokPosted}
									<span class="text-[0.62rem] px-1.5 py-0.5 rounded-full" style="font-family: var(--font-mono); background: var(--color-sage-tint, rgba(90,143,111,0.14)); color: var(--color-sage, #5a8f6f);">✓ auf TikTok</span>
								{/if}
							</div>
							<h2 class="text-sm font-semibold leading-snug" style="color: var(--color-ink);">{card.title}</h2>
						</div>
					</div>

					<!-- Keyword-Hinweis -->
					{#if card.keyword}
						<div class="mb-2 text-xs" style="color: var(--color-ink-soft);">
							🎯 Keyword im Video: <strong style="color: var(--color-ink);">{card.keyword}</strong>
						</div>
					{/if}

					<!-- Caption -->
					<div class="rounded-lg p-3 mb-2 text-[0.82rem] leading-relaxed whitespace-pre-wrap" style="background: var(--color-canvas-soft); color: var(--color-ink); font-family: var(--font-mono);">{card.caption}</div>

					<!-- Hashtags -->
					<div class="flex flex-wrap gap-1.5 mb-3">
						{#each card.hashtags as tag}
							<span class="text-[0.72rem] px-2 py-0.5 rounded-full" style="background: var(--color-canvas-soft); color: var(--color-amber); font-family: var(--font-mono);">{tag}</span>
						{/each}
						{#if !card.captionCurated}
							<span class="text-[0.66rem] px-2 py-0.5" style="color: var(--color-faint);" title="Automatisch aus den Story-Feldern erzeugt (keine handgepflegte Caption).">· auto</span>
						{/if}
					</div>

					<!-- Upload-Checkliste: die Zusatzsignale, die beim manuellen Posten Reichweite bringen (docs/TIKTOK_PLAN.md §8d) -->
					<details class="mb-3 rounded-lg overflow-hidden" style="border: 1px solid var(--color-rule);">
						<summary class="text-xs font-medium px-3 py-2 cursor-pointer select-none" style="background: var(--color-canvas-soft); color: var(--color-ink);">
							📋 Beim Posten mitgeben — Reichweiten-Signale
						</summary>
						<ul class="text-[0.78rem] leading-relaxed px-3 py-2.5 space-y-1.5" style="color: var(--color-ink-soft);">
							<li><strong style="color: var(--color-ink);">Cover:</strong> den „Belegt."-Stempel-Moment (~Sek 15) wählen — NICHT den Text-Startframe.</li>
							<li><strong style="color: var(--color-ink);">KI-Label AN:</strong> „KI-generierte Inhalte" unter „Mehr Optionen" (Pflicht, KI-Stimme).</li>
							<li><strong style="color: var(--color-ink);">Auto-Captions AN:</strong> stützt Watch-Time (Ton-aus-Viewer) + Keyword-Indexierung.</li>
							<li>
								<strong style="color: var(--color-ink);">Standort = große DACH-Stadt</strong> (z.B. Berlin), NIE der Story-Ort — bringt uns in den deutschen „Nearby"-Feed.
							</li>
							<li>
								<strong style="color: var(--color-ink);">Quelle @-erwähnen</strong>, WENN sie einen echten TikTok-Account hat:
								{#if card.mentionHint}<span style="color: var(--color-amber);"> {card.mentionHint}</span>{:else}<span style="color: var(--color-faint);"> Quelle „{card.sourceName ?? '—'}“ prüfen — kein Account gefunden? dann weglassen (nie erfinden).</span>{/if}
							</li>
							<li><strong style="color: var(--color-ink);">Musik:</strong> unser Original-Ton reicht. KEINE Chart-Trending-Sounds (DMCA-/Stummschalt-Risiko für Marken). Höchstens ein Commercial-Library-Track leise.</li>
							<li style="color: var(--color-faint);">Zeit: Di–Do ~16:30–17:30 CET (30–90 Min vor dem Abend-Peak).</li>
						</ul>
					</details>

					<!-- Funnel: der Weg von TikTok zu Newsletter/App (docs/TIKTOK_STRATEGIE.md) -->
					<details class="mb-3 rounded-lg overflow-hidden" style="border: 1px solid var(--color-rule);">
						<summary class="text-xs font-medium px-3 py-2 cursor-pointer select-none" style="background: var(--color-canvas-soft); color: var(--color-ink);">
							🌱 Funnel — Newsletter/App (Nordstern: Abos aus TikTok)
						</summary>
						<div class="text-[0.78rem] leading-relaxed px-3 py-2.5 space-y-2.5" style="color: var(--color-ink-soft);">
							<p><strong style="color: var(--color-ink);">Gepinnten Kommentar setzen</strong> (primärer Klick-Kanal — Link erst ab 1k Follower ODER Business-Account):</p>
							<div class="rounded-lg p-2.5 text-[0.8rem] whitespace-pre-wrap" style="background: var(--color-canvas-soft); color: var(--color-ink); font-family: var(--font-mono);">{card.pinnedComment}</div>
							<button type="button" onclick={() => copy(card.pinnedComment, 'pin-' + card.postId)}
								class="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
								style="background: var(--color-ink); color: var(--color-paper);">
								{copiedKey === 'pin-' + card.postId ? '✓ kopiert' : 'Kommentar kopieren'}
							</button>
							<ul class="space-y-1.5 pt-1">
								<li><strong style="color: var(--color-ink);">Bio-Text:</strong> „Jeden Tag eine belegte gute Nachricht. Kein Doom. → Newsletter" + Link <code style="color: var(--color-amber);">nureine.de/go?to=newsletter&src=tiktok</code> (trackt die Abos).</li>
								<li><strong style="color: var(--color-ink);">Newsletter zuerst, App später</strong> — E-Mail ist die niedrigere Hürde; App kommt in der Willkommensstrecke.</li>
								<li style="color: var(--color-faint);">Ziel ist NICHT Views, sondern bestätigte Abos. Erst Vertrauen (Format), dann Conversion.</li>
							</ul>
						</div>
					</details>

					<!-- Aktionen -->
					<div class="flex flex-wrap items-center gap-2">
						<button type="button" onclick={() => copy(card.full, 'full-' + card.postId)}
							class="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
							style="background: var(--color-ink); color: var(--color-paper);">
							{copiedKey === 'full-' + card.postId ? '✓ kopiert' : 'Caption + Tags kopieren'}
						</button>
						<button type="button" onclick={() => copy(card.caption, 'cap-' + card.postId)}
							class="text-xs px-2.5 py-1.5 rounded-lg transition-colors" style="color: var(--color-ink-soft); border: 1px solid var(--color-rule);">
							{copiedKey === 'cap-' + card.postId ? '✓' : 'nur Text'}
						</button>
						<button type="button" onclick={() => copy(card.hashtags.join(' '), 'tags-' + card.postId)}
							class="text-xs px-2.5 py-1.5 rounded-lg transition-colors" style="color: var(--color-ink-soft); border: 1px solid var(--color-rule);">
							{copiedKey === 'tags-' + card.postId ? '✓' : 'nur Tags'}
						</button>
						{#if card.videoUrl}
							<a href={card.videoUrl} download target="_blank" rel="noopener"
								class="text-xs px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5" style="color: var(--color-ink-soft); border: 1px solid var(--color-rule);">
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
								Video
							</a>
						{/if}
						{#if card.imageUrl}
							<a href={card.imageUrl} download target="_blank" rel="noopener"
								class="text-xs px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5" style="color: var(--color-ink-soft); border: 1px solid var(--color-rule);"
								title="Story-Bild als TikTok-Cover — visueller als der Text-Startframe.">
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
								Cover
							</a>
						{/if}

						<span class="flex-1"></span>

						{#if card.tiktokPosted}
							<form method="POST" action="?/unmark" use:enhance>
								<input type="hidden" name="storyId" value={card.storyId} />
								<button type="submit" class="text-xs px-2.5 py-1.5 rounded-lg" style="color: var(--color-faint);">↩ rückgängig</button>
							</form>
						{:else}
							<form method="POST" action="?/markPosted" use:enhance>
								<input type="hidden" name="storyId" value={card.storyId} />
								<input type="hidden" name="postId" value={card.postId} />
								<button type="submit" class="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
									style="background: var(--color-sage, #5a8f6f); color: #fff;">✓ auf TikTok gepostet</button>
							</form>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
