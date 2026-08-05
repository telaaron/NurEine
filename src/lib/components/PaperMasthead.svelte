<script lang="ts">
	import { newspaperName, issueNumber, issueDate } from '$lib/place';

	interface Props {
		place: string;
		/** Wie viele Meldungen in dieser Ausgabe stehen. */
		count: number;
		/** Entfernung der nächsten Meldung in km — die „Nähe“ der Ausgabe. */
		nearestKm?: number | null;
		date?: Date;
	}

	let { place, count, nearestKm = null, date = new Date() }: Props = $props();

	const title = $derived(newspaperName(place));
	const line = $derived(`${issueDate(date)} · Ausgabe Nr. ${issueNumber(date)}`);
</script>

<header class="masthead">
	<div class="rule-top"></div>

	<p class="kicker">Deine persönliche Ausgabe</p>
	<h1 class="title">{title}</h1>

	<div class="rule-mid"></div>

	<div class="colophon">
		<span>{line}</span>
		<span class="dot">·</span>
		<span class="tnum">{count} {count === 1 ? 'Meldung' : 'Meldungen'}</span>
		{#if nearestKm !== null}
			<span class="dot">·</span>
			<span class="tnum">nächste {nearestKm < 1 ? 'unter 1' : Math.round(nearestKm)} km entfernt</span>
		{/if}
	</div>

	<div class="rule-bottom"></div>
</header>

<style>
	.masthead { text-align: center; padding: 0.25rem 0 1.25rem; }

	/* Doppellinie oben, dünne unten — das klassische Zeitungskopf-Muster. */
	.rule-top { height: 3px; background: var(--color-ink); }
	.rule-mid { height: 1px; background: var(--color-rule-strong); margin: 0.7rem 0 0.55rem; }
	.rule-bottom { height: 1px; background: var(--color-ink); margin-top: 0.55rem; }

	.kicker {
		font-family: var(--font-sans);
		font-size: 0.62rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: var(--color-muted);
		margin-top: 0.75rem;
	}

	.title {
		font-family: var(--font-serif);
		font-weight: 700;
		color: var(--color-ink);
		line-height: 1;
		margin-top: 0.35rem;
		/* Gesperrt wie ein Zeitungstitel, skaliert bis aufs Handy herunter. */
		letter-spacing: 0.04em;
		font-size: clamp(1.45rem, 5.4vw, 3.4rem);
		text-wrap: balance;
	}

	.colophon {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.45rem;
		font-family: var(--font-sans);
		font-size: 0.72rem;
		color: var(--color-muted);
	}
	.dot { opacity: 0.5; }
</style>
