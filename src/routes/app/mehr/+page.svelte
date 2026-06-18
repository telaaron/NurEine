<script lang="ts">
	import { CATEGORIES } from '$lib/categories';
	import { loadPrefs, savePrefs, type AppPrefs } from '$lib/app/prefs';
	import { subscribe, publicStoryUrl } from '$lib/app/api';
	import { shareStory, openExternal, tapLight } from '$lib/app/native';
	import { getRef } from '$lib/referral';

	let prefs = $state<AppPrefs | null>(null);
	let selected = $state<Set<string>>(new Set());

	// Subscribe form
	let email = $state('');
	let subBusy = $state(false);
	let subMsg = $state('');
	let subOk = $state(false);

	$effect(() => {
		loadPrefs().then((p) => {
			prefs = p;
			selected = new Set(p.categories);
			email = p.email ?? '';
		});
	});

	async function toggleCat(slug: string) {
		tapLight();
		const next = new Set(selected);
		if (next.has(slug)) next.delete(slug);
		else next.add(slug);
		selected = next;
		await savePrefs({ categories: [...next] });
	}

	async function togglePush() {
		if (!prefs) return;
		tapLight();
		// M2 wires real APNs registration; for now we record the intent.
		prefs = await savePrefs({ pushWanted: !prefs.pushWanted });
	}

	async function toggleKids() {
		if (!prefs) return;
		tapLight();
		const nextVal = prefs.hasKids === true ? false : true;
		prefs = await savePrefs({ hasKids: nextVal });
	}

	async function doSubscribe(e: SubmitEvent) {
		e.preventDefault();
		if (subBusy) return;
		const addr = email.trim();
		if (!addr) {
			subMsg = 'Bitte gib eine E-Mail-Adresse ein.';
			subOk = false;
			return;
		}
		subBusy = true;
		subMsg = '';
		const res = await subscribe(addr, [...selected], getRef());
		subOk = res.ok;
		subMsg = res.message;
		if (res.ok) await savePrefs({ email: addr });
		subBusy = false;
	}

	function shareApp() {
		tapLight();
		shareStory({
			title: 'NurEine — eine gute Nachricht am Tag',
			text: 'Kein Feed, kein Algorithmus. Eine belegte Geschichte über echten Fortschritt, jeden Morgen.',
			url: 'https://nureine.de'
		});
	}

	const links = [
		{ label: 'Der Stand der Welt', href: 'https://nureine.de/stand-der-welt' },
		{ label: 'Methodik — so wählen wir', href: 'https://nureine.de/methodik' },
		{ label: 'Unsere Werte', href: 'https://nureine.de/werte' },
		{ label: 'So arbeiten wir', href: 'https://nureine.de/redaktion' }
	];
</script>

<div class="mehr">
	<h1 class="display page-title">Mehr</h1>

	<!-- Push -->
	<section class="card">
		<div class="row-toggle">
			<div>
				<div class="row-title">Morgen-Benachrichtigung</div>
				<div class="row-sub serif">Dein Lichtblick um 6:25 Uhr — direkt am Sperrbildschirm.</div>
			</div>
			<button class="switch" class:on={prefs?.pushWanted} onclick={togglePush} role="switch" aria-checked={prefs?.pushWanted} aria-label="Morgen-Benachrichtigung">
				<span class="knob"></span>
			</button>
		</div>
		{#if prefs?.pushWanted}
			<p class="hint">Wird mit dem nächsten Update aktiv geschaltet.</p>
		{/if}
	</section>

	<!-- Themen -->
	<section class="block">
		<p class="block-label eyebrow">Deine Themen</p>
		<p class="block-sub serif">Wähle, was dich interessiert — oder lass alle an.</p>
		<div class="topics">
			{#each CATEGORIES as c}
				<button class="topic" class:on={selected.has(c.slug)} onclick={() => toggleCat(c.slug)}>
					<span class="topic-emoji">{c.emoji}</span>{c.label}
				</button>
			{/each}
		</div>
		<button class="kids-row" onclick={toggleKids}>
			<span class="switch sm" class:on={prefs?.hasKids === true}><span class="knob"></span></span>
			<span>Geschichten mit Kinder-Erklärung hervorheben</span>
		</button>
	</section>

	<!-- Newsletter -->
	<section class="block">
		<p class="block-label eyebrow">Newsletter</p>
		{#if subOk}
			<div class="sub-done">
				<div class="sub-done-icon">✓</div>
				<p class="serif">{subMsg}</p>
			</div>
		{:else}
			<p class="block-sub serif">Eine gute Nachricht, jeden Morgen per Mail. Jederzeit abbestellbar.</p>
			<form class="sub-form" onsubmit={doSubscribe}>
				<input type="email" bind:value={email} placeholder="Deine E-Mail" autocomplete="email" disabled={subBusy} />
				<button type="submit" disabled={subBusy}>{subBusy ? '…' : 'Abonnieren'}</button>
			</form>
			{#if subMsg}<p class="sub-msg serif">{subMsg}</p>{/if}
		{/if}
	</section>

	<!-- Empfehlen -->
	<section class="block">
		<button class="big-share" onclick={shareApp}>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
			NurEine weiterempfehlen
		</button>
	</section>

	<!-- Links -->
	<section class="block">
		<p class="block-label eyebrow">Entdecken</p>
		<div class="links">
			{#each links as l}
				<button class="link-row" onclick={() => openExternal(l.href)}>
					{l.label}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
				</button>
			{/each}
		</div>
	</section>

	<p class="foot">NurEine · Teltow, Brandenburg · 2026</p>
</div>

<style>
	.mehr { padding: 14px 20px 0; }
	.page-title { font-size: 34px; font-weight: 600; color: var(--color-ink); }

	.card { margin-top: 16px; background: var(--color-paper); border: 1px solid var(--color-rule); border-radius: 14px; padding: 14px 15px; }
	.row-toggle { display: flex; align-items: center; gap: 14px; justify-content: space-between; }
	.row-title { font-size: 15px; font-weight: 500; color: var(--color-ink); }
	.row-sub { font-size: 13px; color: var(--color-muted); line-height: 1.45; margin-top: 3px; }
	.hint { font-family: var(--font-mono); font-size: 11px; color: var(--color-amber-deep); margin-top: 10px; }

	.switch { position: relative; width: 50px; height: 30px; border-radius: 999px; border: none; background: var(--color-rule-strong); flex: 0 0 auto; transition: background 0.18s; }
	.switch.on { background: var(--color-sage); }
	.switch .knob { position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform 0.18s; }
	.switch.on .knob { transform: translateX(20px); }
	.switch.sm { width: 40px; height: 24px; }
	.switch.sm .knob { width: 18px; height: 18px; }
	.switch.sm.on .knob { transform: translateX(16px); }

	.block { margin-top: 26px; }
	.block-label { color: var(--color-amber-deep); font-family: var(--font-mono); }
	.block-sub { font-size: 13px; color: var(--color-muted); margin-top: 6px; line-height: 1.5; }

	.topics { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
	.topic { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink-soft); border-radius: 999px; padding: 8px 13px; font-size: 13px; }
	.topic.on { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
	.topic:active { transform: scale(0.96); }
	.topic-emoji { font-size: 14px; }

	.kids-row { display: flex; align-items: center; gap: 11px; margin-top: 14px; background: transparent; border: none; color: var(--color-ink-soft); font-size: 13px; text-align: left; padding: 0; }

	.sub-form { display: flex; gap: 8px; margin-top: 12px; }
	.sub-form input { flex: 1; min-width: 0; border: 1px solid var(--color-rule-strong); background: var(--color-paper); color: var(--color-ink); border-radius: 999px; padding: 11px 16px; font-size: 14px; }
	.sub-form button { border: none; background: var(--color-amber); color: var(--color-paper); border-radius: 999px; padding: 11px 18px; font-size: 14px; font-weight: 500; white-space: nowrap; }
	.sub-form button:disabled { opacity: 0.6; }
	.sub-msg { font-size: 13px; color: var(--color-ink-soft); margin-top: 10px; }
	.sub-done { display: flex; gap: 12px; align-items: center; margin-top: 12px; background: var(--color-sage-tint); border: 1px solid var(--color-sage-soft); border-radius: 14px; padding: 14px 15px; }
	.sub-done-icon { width: 34px; height: 34px; border-radius: 50%; background: var(--color-sage); color: #fff; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; font-size: 18px; }
	.sub-done p { font-size: 13px; color: var(--color-ink-soft); line-height: 1.45; }

	.big-share { display: flex; align-items: center; justify-content: center; gap: 9px; width: 100%; border: 1px solid var(--color-rule-strong); background: var(--color-paper); color: var(--color-ink); border-radius: 999px; padding: 13px; font-size: 14px; font-weight: 500; }
	.big-share:active { transform: scale(0.98); }

	.links { margin-top: 10px; border: 1px solid var(--color-rule); border-radius: 14px; overflow: hidden; }
	.link-row { display: flex; justify-content: space-between; align-items: center; width: 100%; background: var(--color-paper); border: none; border-bottom: 1px solid var(--color-rule); color: var(--color-ink-soft); padding: 14px 15px; font-size: 14px; text-align: left; }
	.link-row:last-child { border-bottom: none; }
	.link-row svg { color: var(--color-faint); }
	.link-row:active { background: var(--color-canvas-soft); }

	.foot { text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--color-faint); margin: 28px 0 12px; }
</style>
