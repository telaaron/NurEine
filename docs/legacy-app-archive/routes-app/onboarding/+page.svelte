<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { CATEGORIES } from '$lib/categories';
	import { savePrefs } from '$lib/app/prefs';
	import { requestPush, tapLight } from '$lib/app/native';

	let step = $state(0);
	let selected = $state<Set<string>>(new Set());
	let busy = $state(false);

	const TOTAL = 3;

	function toggle(slug: string) {
		tapLight();
		const next = new Set(selected);
		if (next.has(slug)) next.delete(slug);
		else next.add(slug);
		selected = next;
	}

	async function next() {
		tapLight();
		if (step === 1) await savePrefs({ categories: [...selected] });
		if (step < TOTAL - 1) {
			step += 1;
		} else {
			await finish(false);
		}
	}

	async function enablePush() {
		if (busy) return;
		busy = true;
		const ok = await requestPush();
		await savePrefs({ pushWanted: ok });
		busy = false;
		await finish(ok);
	}

	async function finish(pushWanted: boolean) {
		await savePrefs({ onboarded: true, ...(pushWanted ? { pushWanted: true } : {}) });
		goto(base + '/app', { replaceState: true });
	}

	function skip() {
		tapLight();
		finish(false);
	}
</script>

<div class="ob">
	<button class="ob-skip" onclick={skip}>Überspringen</button>

	<div class="ob-body">
		{#if step === 0}
			<div class="ob-step">
				<div class="ob-sun"><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#faf6ee" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg></div>
				<h1 class="display">Eine gute Nachricht.<br />Jeden Morgen.</h1>
				<p class="serif">Kein Feed, kein Algorithmus, kein Sog. Eine belegte Geschichte über echten Fortschritt — in zwei Minuten.</p>
			</div>
		{:else if step === 1}
			<div class="ob-step ob-topics-step">
				<h1 class="display">Was bewegt dich?</h1>
				<p class="serif">Wähle deine Themen — oder lass alle an. Du kannst das jederzeit ändern.</p>
				<div class="ob-topics">
					{#each CATEGORIES as c}
						<button class="ob-topic" class:on={selected.has(c.slug)} onclick={() => toggle(c.slug)}>
							<span>{c.emoji}</span>{c.label}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<div class="ob-step">
				<div class="ob-sun"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#faf6ee" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg></div>
				<h1 class="display">Dürfen wir dich morgens wecken?</h1>
				<p class="serif">Dein Lichtblick erscheint um 6:25 Uhr direkt am Sperrbildschirm — bevor das Postfach dich stresst. Eine Nachricht. Mehr nicht.</p>
			</div>
		{/if}
	</div>

	<div class="ob-foot">
		<div class="ob-dots" aria-hidden="true">
			{#each Array(TOTAL) as _, i}<span class:on={i === step}></span>{/each}
		</div>
		{#if step < TOTAL - 1}
			<button class="ob-cta" onclick={next}>{step === 0 ? 'Los geht’s' : 'Weiter'}</button>
		{:else}
			<button class="ob-cta" onclick={enablePush} disabled={busy}>{busy ? '…' : 'Benachrichtigung erlauben'}</button>
			<button class="ob-later" onclick={skip}>Vielleicht später</button>
		{/if}
	</div>
</div>

<style>
	.ob { position: relative; min-height: 100dvh; display: flex; flex-direction: column; padding: calc(env(safe-area-inset-top, 0px) + 12px) 28px calc(env(safe-area-inset-bottom, 0px) + 28px); }
	.ob-skip { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 12px); right: 20px; background: none; border: none; font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); z-index: 2; }

	.ob-body { flex: 1; display: flex; align-items: center; justify-content: center; }
	.ob-step { text-align: center; }
	.ob-topics-step { text-align: center; width: 100%; }
	.ob-sun { width: 88px; height: 88px; border-radius: 50%; background: var(--color-amber); display: flex; align-items: center; justify-content: center; margin: 0 auto 28px; }
	.ob-step h1 { font-size: 30px; font-weight: 600; line-height: 1.08; color: var(--color-ink); }
	.ob-step p { font-size: 16px; line-height: 1.6; color: var(--color-ink-soft); margin-top: 16px; max-width: 30ch; margin-left: auto; margin-right: auto; }

	.ob-topics { display: flex; flex-wrap: wrap; gap: 9px; justify-content: center; margin-top: 26px; }
	.ob-topic { display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink-soft); border-radius: 999px; padding: 10px 15px; font-size: 14px; }
	.ob-topic.on { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
	.ob-topic:active { transform: scale(0.96); }

	.ob-foot { display: flex; flex-direction: column; align-items: center; gap: 16px; }
	.ob-dots { display: flex; gap: 7px; }
	.ob-dots span { width: 7px; height: 7px; border-radius: 4px; background: var(--color-rule-strong); transition: all 0.2s; }
	.ob-dots span.on { width: 22px; background: var(--color-amber); }
	.ob-cta { width: 100%; background: var(--color-ink); color: var(--color-paper); border: none; border-radius: 999px; padding: 16px; font-size: 16px; font-weight: 500; }
	.ob-cta:active { transform: scale(0.98); }
	.ob-cta:disabled { opacity: 0.6; }
	.ob-later { background: none; border: none; font-size: 14px; color: var(--color-muted); }
</style>
