<script lang="ts">
	import { base } from '$app/paths';
	import { track } from '$lib/track';

	let { data } = $props();

	type Platform = 'whatsapp' | 'instagram' | 'threads' | 'facebook' | 'x' | 'link';
	type Audience = 'allgemein' | '60plus' | 'familie' | 'skeptiker' | 'klima';

	const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
		{ id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
		{ id: 'instagram', label: 'Instagram', icon: '📷' },
		{ id: 'threads', label: 'Threads', icon: '🧵' },
		{ id: 'facebook', label: 'Facebook', icon: '👍' },
		{ id: 'x', label: 'X', icon: '𝕏' },
		{ id: 'link', label: 'Nur Link', icon: '🔗' }
	];
	const AUDIENCES: { id: Audience; label: string; hint: string }[] = [
		{ id: 'allgemein', label: 'Allgemein', hint: 'Für alle' },
		{ id: '60plus', label: '60+', hint: 'Ältere Zielgruppe' },
		{ id: 'familie', label: 'Familie', hint: 'Eltern & Kinder' },
		{ id: 'skeptiker', label: 'Skeptiker', hint: 'Wollen Belege' },
		{ id: 'klima', label: 'Klima-Interessiert', hint: 'Fortschritt sehen' }
	];

	let platform = $state<Platform>('whatsapp');
	let audience = $state<Audience>('allgemein');
	let refCode = $state('');
	let storyId = $state(''); // optional: bestimmte Story

	// Karte-URL (Empfehlungs-Karte mit Story als Beweis).
	const cardUrl = $derived.by(() => {
		const p = new URLSearchParams();
		p.set('audience', audience);
		if (refCode.trim()) p.set('ref', refCode.trim());
		if (storyId) {
			const s = data.topStories.find((t) => t.id === storyId);
			if (s) p.set('slug', slugify(s.title, s.id));
		}
		return `${base}/api/recommend-card?${p.toString()}`;
	});

	const link = $derived(refCode.trim() ? `https://nureine.de/?ref=${refCode.trim()}` : 'https://nureine.de');

	// Plattform-spezifischer Begleittext (für die, die ihn lesen — aber die Karte trägt die Botschaft).
	const captions: Record<Platform, () => string> = {
		whatsapp: () => `Schau mal — ${audienceLine()} 🌍\nGute Nachrichten, eine pro Tag, geprüft & werbefrei.\n👉 ${link}`,
		instagram: () => `${audienceLine()}\n\nNurEine: eine gute Nachricht am Tag. Kein Doomscrolling, kein Algorithmus. ✨\nLink in Bio${refCode.trim() ? ` (mit Code ${refCode.trim()})` : ''}.`,
		threads: () => `${audienceLine()}\n\nNurEine bringt jeden Tag eine geprüfte gute Nachricht — werbefrei.\n${link}`,
		facebook: () => `${audienceLine()}\n\nIch hab NurEine entdeckt: eine kuratierte gute Nachricht pro Tag, mit Quelle und Wirkungsindex. Keine Werbung, kein Algorithmus.\n${link}`,
		x: () => `${audienceLine()} 🌍\nGute Nachrichten, täglich eine, geprüft & werbefrei.\n${link}`,
		link: () => link
	};
	function audienceLine(): string {
		return {
			allgemein: 'Schluss mit nur schlechten Nachrichten.',
			'60plus': 'Endlich mal eine gute Nachricht zum Tag.',
			familie: 'Gute Nachrichten zum Vorlesen und Weiterreden.',
			skeptiker: 'Gute Nachrichten — aber mit Quelle und Zahl.',
			klima: 'Die Welt wird an vielen Stellen besser.'
		}[audience];
	}

	function slugify(t: string, id: string): string {
		return t.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80) + '-' + id.slice(0,8);
	}

	let copied = $state('');
	function copy(text: string, key: string) {
		navigator.clipboard?.writeText(text).then(() => {
			copied = key;
			track('story_shared', { format: platform, via: 'teilen-generator' });
			setTimeout(() => (copied = ''), 1800);
		}).catch(() => {});
	}

	const showCard = $derived(platform !== 'link');
</script>

<svelte:head>
	<title>NurEine weiterempfehlen — fertige Assets für jede Plattform</title>
	<meta name="description" content="Empfiehl NurEine weiter: wähle Plattform und Zielgruppe, bekomme eine fertige Karte und den passenden Text — mit deinem Empfehlungslink." />
	<link rel="canonical" href="https://nureine.de/teilen" />
</svelte:head>

<section class="mx-auto max-w-[820px] px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
	<p class="eyebrow" style="color: var(--color-amber);">Weiterempfehlen</p>
	<h1 class="page-h1 mt-3" style="color: var(--color-ink); font-weight: 700;">
		Eine gute Nachricht weiterschenken.
	</h1>
	<p class="mt-5 text-lg leading-relaxed" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		Wähle Plattform und für wen — du bekommst eine fertige Karte und den passenden Text.
		Die Karte erzählt schon alles, auch wenn niemand den Text liest. Mit deinem Empfehlungslink, wenn du magst.
	</p>

	<!-- Plattform -->
	<div class="mt-8">
		<p class="text-xs uppercase tracking-[0.16em] mb-2" style="color: var(--color-faint); font-family: var(--font-mono);">Plattform</p>
		<div class="flex flex-wrap gap-2">
			{#each PLATFORMS as p}
				<button type="button" onclick={() => (platform = p.id)}
					class="px-4 py-2.5 rounded-full text-sm font-medium transition-all"
					style={platform === p.id ? 'background: var(--color-surface-ink); color: var(--color-on-ink);' : 'background: var(--color-canvas-soft); color: var(--color-ink-soft); border: 1px solid var(--color-rule);'}>
					<span style="margin-right:6px;">{p.icon}</span>{p.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Zielgruppe -->
	<div class="mt-6">
		<p class="text-xs uppercase tracking-[0.16em] mb-2" style="color: var(--color-faint); font-family: var(--font-mono);">Für wen?</p>
		<div class="flex flex-wrap gap-2">
			{#each AUDIENCES as a}
				<button type="button" onclick={() => (audience = a.id)}
					class="px-4 py-2.5 rounded-full text-sm font-medium transition-all"
					style={audience === a.id ? 'background: var(--color-amber); color: var(--color-on-accent);' : 'background: var(--color-canvas-soft); color: var(--color-ink-soft); border: 1px solid var(--color-rule);'}
					title={a.hint}>
					{a.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Optionen: Ref-Code + Story -->
	<div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.16em] mb-2" style="color: var(--color-faint); font-family: var(--font-mono);">Dein Empfehlungscode (optional)</p>
			<input type="text" bind:value={refCode} placeholder="z.B. anna" maxlength="16"
				class="w-full px-3 py-2 rounded-[10px] text-sm" style="background: var(--color-paper); border: 1px solid var(--color-rule); color: var(--color-ink);" />
			<p class="mt-1 text-xs" style="color: var(--color-faint);">Findest du in deinen <a href={base + '/einstellungen'} class="underline" style="color: var(--color-amber);">Einstellungen</a>.</p>
		</div>
		<div>
			<p class="text-xs uppercase tracking-[0.16em] mb-2" style="color: var(--color-faint); font-family: var(--font-mono);">Beispiel-Geschichte (optional)</p>
			<select bind:value={storyId} class="w-full px-3 py-2 rounded-[10px] text-sm" style="background: var(--color-paper); border: 1px solid var(--color-rule); color: var(--color-ink);">
				<option value="">Automatisch (passend zur Zielgruppe)</option>
				{#each data.topStories as s}
					<option value={s.id}>{s.title}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Ergebnis -->
	<div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
		{#if showCard}
			<div>
				<p class="text-xs uppercase tracking-[0.16em] mb-2" style="color: var(--color-muted); font-family: var(--font-mono);">Deine Karte (9:16)</p>
				<div class="rounded-xl overflow-hidden" style="box-shadow: var(--shadow-md); border: 1px solid var(--color-rule);">
					<img src={cardUrl} alt="Empfehlungs-Karte" loading="eager" style="display:block;width:100%;aspect-ratio:9/16;object-fit:cover;" />
				</div>
				<a href={cardUrl} download={`nureine-empfehlung-${audience}.jpg`} onclick={() => track('story_shared', { format: platform, via: 'card-download' })}
					class="mt-2 block text-center px-4 py-2.5 rounded-full text-sm font-medium" style="background: var(--color-surface-ink); color: var(--color-on-ink);">
					Karte herunterladen ↓
				</a>
			</div>
		{/if}

		<div class={showCard ? '' : 'lg:col-span-2'}>
			<p class="text-xs uppercase tracking-[0.16em] mb-2" style="color: var(--color-muted); font-family: var(--font-mono);">Dein Text für {PLATFORMS.find((p) => p.id === platform)?.label}</p>
			<div class="p-4 rounded-[10px] whitespace-pre-line text-sm leading-relaxed" style="background: var(--color-paper); border: 1px solid var(--color-rule); color: var(--color-ink-soft); font-family: var(--font-serif);">{captions[platform]()}</div>
			<button type="button" onclick={() => copy(captions[platform](), 'cap')}
				class="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style="background: {copied === 'cap' ? 'var(--color-sage)' : 'var(--color-amber)'}; color: var(--color-on-ink);">
				{copied === 'cap' ? 'Kopiert ✓' : 'Text kopieren'}
			</button>

			<p class="text-xs uppercase tracking-[0.16em] mb-2 mt-6" style="color: var(--color-muted); font-family: var(--font-mono);">Dein Link</p>
			<div class="flex items-center gap-2">
				<code class="flex-1 px-3 py-2 rounded-[10px] text-sm truncate" style="background: var(--color-paper); border: 1px solid var(--color-rule); color: var(--color-ink); font-family: var(--font-mono);">{link}</code>
				<button type="button" onclick={() => copy(link, 'link')}
					class="px-4 py-2 rounded-full text-sm font-medium shrink-0" style="background: {copied === 'link' ? 'var(--color-sage)' : 'var(--color-surface-ink)'}; color: var(--color-on-ink);">
					{copied === 'link' ? '✓' : 'Kopieren'}
				</button>
			</div>
		</div>
	</div>

	<p class="mt-10 text-xs text-center" style="color: var(--color-faint); font-family: var(--font-serif);">
		So einfach: Karte speichern, Text kopieren, posten. Danke, dass du gute Nachrichten weiterträgst. 🧡
	</p>
</section>
