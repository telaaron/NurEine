<script lang="ts">
	let { data } = $props();

	// Folie-URL für einen Stil (kind). 'hook' nutzt den Bild-Stil als Feed-Stopper.
	function slideUrl(slug: string, kind: string): string {
		if (kind === 'hook') return `/api/carousel/${slug}/1?style=image`;
		return `/api/carousel/${slug}/1?kind=${kind}`;
	}

	const kindLabels: Record<string, string> = {
		hook: 'Folie 1 — Hook (Daumen-Stopper)',
		aufloesung: 'Auflösung',
		stille: 'Stille (Nachhall)',
		beleg: 'Beleg (#1 — Glaubwürdigkeit)',
		methodik: 'Methodik (#6 — 3 Balken)',
		endcard: 'Endcard (schickbar, share_hook)'
	};

	let customSlug = $state('');
	function loadSlug() {
		if (customSlug.trim()) window.location.href = `?slug=${encodeURIComponent(customSlug.trim())}`;
	}
</script>

<svelte:head><title>Social-Preview · NurEine Admin</title></svelte:head>

<div class="wrap">
	<header>
		<h1>Social-Preview <span class="dry">DRY — postet nichts</span></h1>
		<p class="sub">
			Heute ist <strong>{data.weekdayName}</strong>. Sichtprüfung der Carousel-Folien & des
			Wochen-Digests, bevor irgendetwas live geht. Autopilot-Status hat hier keinen Effekt.
		</p>
		<div class="slugbar">
			<input
				placeholder="Anderen Story-Slug testen…"
				bind:value={customSlug}
				onkeydown={(e) => e.key === 'Enter' && loadSlug()}
			/>
			<button onclick={loadSlug}>Laden</button>
		</div>
	</header>

	{#if data.story}
		<section>
			<h2>Tages-Story</h2>
			<div class="meta">
				<span class="pill">{data.story.title}</span>
				<span class="pill" class:ok={data.story.igOk} class:no={!data.story.igOk}>
					{data.story.igOk ? 'ig_ok ✓' : 'NICHT ig_ok'}
				</span>
				<span class="pill">Hook: {data.story.hookType ?? '—'}</span>
				<span class="pill">Wirkung {data.story.impactScore}/100</span>
				<span class="pill" class:no={!data.story.hasSlides}>
					{data.story.hasSlides ? 'Slides vorhanden' : 'keine Slides → Einzelbild'}
				</span>
			</div>

			{#if data.plan}
				<h3>
					Heutige Carousel-Form ({data.weekdayName}):
					<code>{data.plan.label}</code> → {data.plan.kinds.join(' · ')}
				</h3>
				<div class="grid">
					{#each data.plan.kinds as kind (kind)}
						<figure>
							<img src={slideUrl(data.story.slug, kind)} alt={kind} loading="lazy" />
							<figcaption>{kindLabels[kind] ?? kind}</figcaption>
						</figure>
					{/each}
				</div>
			{/if}

			<h3>Alle Folien-Stile (Referenz)</h3>
			<div class="grid">
				{#each data.allKinds as kind (kind)}
					<figure>
						<img src={slideUrl(data.story.slug, kind)} alt={kind} loading="lazy" />
						<figcaption>{kindLabels[kind] ?? kind}</figcaption>
					</figure>
				{/each}
			</div>
		</section>
	{:else}
		<section><p class="empty">Heute keine ig_ok-Story → kein Tages-Post ("lieber leer als falsch").</p></section>
	{/if}

	{#if data.story}
		<section>
			<h2>Reel-Frames (9:16 · Phase 2) — Typ {data.story.reelType}</h2>
			<p class="sub">
				Die drei Standbilder, aus denen ffmpeg das Reel baut (Bewegung kommt erst im MP4).
				Typ {data.story.reelType}: {data.story.reelType === 'A' ? 'Satz auf Schwarz' : data.story.reelType === 'B' ? 'Atmendes Bild' : 'Zahl zählt hoch'}.
			</p>
			<div class="grid reels">
				{#each ['hook', 'aufloesung', 'endcard'] as frame (frame)}
					<figure>
						<img class="nine" src={`/api/reel-frame/${data.story.slug}/${frame}`} alt={frame} loading="lazy" />
						<figcaption>{frame}</figcaption>
					</figure>
				{/each}
			</div>
		</section>
	{/if}

	<section>
		<h2>Wochen-Digest (#10 · Sonntag)</h2>
		{#if data.digestCount > 0}
			<p class="sub">{data.digestCount} Folien aus {data.digestStoryTitles.length} Top-Stories der Woche:</p>
			<ol class="titles">
				{#each data.digestStoryTitles as t (t)}<li>{t}</li>{/each}
			</ol>
			<div class="grid">
				{#each Array(data.digestCount) as _, i (i)}
					<figure>
						<img src={`/api/digest/${i + 1}`} alt={`Digest-Folie ${i + 1}`} loading="lazy" />
						<figcaption>Folie {i + 1}{i === 0 ? ' — Cover' : i === data.digestCount - 1 ? ' — Endcard' : ''}</figcaption>
					</figure>
				{/each}
			</div>
		{:else}
			<p class="empty">Diese Woche zu wenig Stories (&lt;3) für einen Digest.</p>
		{/if}
	</section>
</div>

<style>
	.wrap { max-width: 1100px; margin: 0 auto; padding: 32px 24px 80px; color: #16140f; }
	h1 { font-size: 28px; margin: 0 0 6px; display: flex; align-items: center; gap: 12px; }
	.dry { font-size: 13px; font-weight: 600; background: #bd6a35; color: #fff; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.04em; }
	.sub { color: #6b6359; margin: 0 0 16px; line-height: 1.5; }
	.slugbar { display: flex; gap: 8px; margin-bottom: 8px; }
	.slugbar input { flex: 1; padding: 9px 12px; border: 1px solid #d8d0c4; border-radius: 8px; font-size: 14px; }
	.slugbar button { padding: 9px 18px; background: #16140f; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
	section { margin-top: 36px; }
	h2 { font-size: 20px; border-bottom: 2px solid #ece4d6; padding-bottom: 8px; }
	h3 { font-size: 15px; color: #6b6359; font-weight: 600; margin: 24px 0 12px; }
	h3 code, .titles { font-family: ui-monospace, monospace; }
	code { background: #f0e9db; padding: 2px 7px; border-radius: 5px; color: #9c5527; }
	.meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
	.pill { font-size: 13px; background: #f0e9db; padding: 5px 11px; border-radius: 16px; }
	.pill.ok { background: #d8e6d2; color: #3e5836; }
	.pill.no { background: #efd6d6; color: #8a4a4a; }
	.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }
	figure { margin: 0; }
	figure img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 10px; border: 1px solid #e4dccf; background: #f4efe6; }
	figure img.nine { aspect-ratio: 9 / 16; }
	.grid.reels { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
	figcaption { font-size: 12px; color: #6b6359; margin-top: 6px; text-align: center; }
	.titles { color: #6b6359; font-size: 14px; margin: 0 0 16px; padding-left: 20px; }
	.titles li { margin: 3px 0; }
	.empty { color: #9a9087; font-style: italic; padding: 16px 0; }
</style>
