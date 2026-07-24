<script lang="ts">
	/**
	 * Wartungs-Hinweis (2026-07-16 bis 20.).
	 *
	 * Anlass: Die Datenbank (Supabase) hat das Monats-Kontingent gerissen und ist
	 * gesperrt, bis die Abrechnungsperiode am 20.07. zurücksetzt. Die Seite kann
	 * bis dahin keine Geschichten laden. Statt einer leeren, kaputt wirkenden Seite
	 * sagen wir ehrlich, was los ist — das ist die Haltung, für die NurEine steht.
	 *
	 * SELBST-ABSCHALTEND: Ab UNTIL verschwindet der Hinweis automatisch, ohne dass
	 * jemand deployen muss. Danach kann die Komponente ersatzlos raus.
	 */
	const UNTIL = new Date('2026-07-20T00:00:00+02:00');
	const active = Date.now() < UNTIL.getTime();
</script>

{#if active}
	<div class="wrap" role="status" aria-live="polite">
		<div class="inner">
			<span class="dot" aria-hidden="true"></span>
			<p class="text">
				<strong>Kurze Pause.</strong>
				Unsere Geschichten sind gerade nicht abrufbar — wir haben unser Speicher-Kontingent
				überschritten. Am <strong>20. Juli</strong> sind wir automatisch wieder da,
				mit allem drum und dran. Entschuldige die Unterbrechung.
			</p>
		</div>
	</div>
{/if}

<style>
	/* Ruhig und ehrlich statt Alarm-Rot: derselbe warme Ton wie die Marke, nur
	   gedeckter. Nicht wegklickbar — die Info ist relevant, solange sie stimmt. */
	.wrap {
		width: 100%;
		background: var(--color-ink);
		color: var(--color-paper);
	}
	.inner {
		margin: 0 auto;
		max-width: 1240px;
		padding: 0.7rem 1rem;
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 8px;
		background: var(--color-amber);
		flex: none;
		margin-top: 0.45rem;
	}
	.text {
		font-size: 0.86rem;
		line-height: 1.5;
		font-family: var(--font-serif);
		margin: 0;
	}
	.text strong { font-weight: 600; }
	@media (min-width: 640px) {
		.inner { padding: 0.75rem 1.5rem; }
		.text { font-size: 0.92rem; }
	}
</style>
