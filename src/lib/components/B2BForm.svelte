<script lang="ts">
	import { INTERESSE_OPTIONS } from '$lib/b2b-content';
	// Demo-Formular für die Varianten-Vorschau. Sendet (noch) nicht ab — der
	// echte Endpoint /api/b2b-lead kommt mit der gewählten Variante. Hier nur
	// Optik + lokaler Bestätigungs-State, damit man den Abschluss beurteilen kann.
	let { accent = 'var(--color-amber)' }: { accent?: string } = $props();
	let sent = $state(false);
	function submit(e: SubmitEvent) {
		e.preventDefault();
		sent = true;
	}
</script>

{#if sent}
	<div class="done" style="border-color: {accent}">
		<strong>Danke!</strong>
		<p>Wir melden uns innerhalb von 24 Stunden. (Vorschau — sendet noch nicht wirklich.)</p>
	</div>
{:else}
	<form onsubmit={submit} class="form">
		<div class="row">
			<label>Firma<input required placeholder="Musterfirma GmbH" /></label>
			<label>Ansprechpartner<input required placeholder="Vor- und Nachname" /></label>
		</div>
		<div class="row">
			<label>E-Mail<input required type="email" placeholder="name@firma.de" /></label>
			<label
				>Interesse<select>
					{#each INTERESSE_OPTIONS as o}<option>{o}</option>{/each}
				</select></label
			>
		</div>
		<label>Nachricht (optional)<textarea rows="3" placeholder="Erzählt uns kurz von euch …"></textarea></label>
		<button type="submit" style="background: {accent}">Pilot anfragen</button>
		<p class="fine">Kein Newsletter-Zwang. Wir nutzen die Daten nur, um euch zum Pilot zu antworten.</p>
	</form>
{/if}

<style>
	.form { display: flex; flex-direction: column; gap: 1rem; }
	.row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
	label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; font-weight: 600; color: var(--color-ink-soft); }
	input, select, textarea {
		font-family: var(--font-sans); font-size: 1rem; padding: 0.7rem 0.9rem;
		border: 1px solid var(--color-rule); border-radius: 10px; background: var(--color-elevated);
		color: var(--color-ink); font-weight: 400;
	}
	input:focus, select:focus, textarea:focus { outline: 2px solid var(--color-amber-soft); border-color: var(--color-amber); }
	button {
		margin-top: 0.4rem; padding: 0.9rem 1.5rem; border: none; border-radius: 10px;
		color: #fff; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: var(--font-sans);
	}
	.fine { font-size: 0.78rem; color: var(--color-faint); margin: 0; }
	.done { padding: 1.5rem; border: 2px solid; border-radius: 12px; background: var(--color-paper); }
	.done strong { font-size: 1.2rem; color: var(--color-ink); }
	.done p { margin: 0.5rem 0 0; color: var(--color-muted); }
	@media (max-width: 640px) { .row { grid-template-columns: 1fr; } }
</style>
