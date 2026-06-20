<script lang="ts">
	const url = 'https://nureine.de/datenschutz';
</script>

<svelte:head>
	<title>Datenschutzerklärung — NurEine</title>
	<meta name="description" content="Wie NurEine personenbezogene Daten verarbeitet — DSGVO-konform, transparent." />
	<link rel="canonical" href={url} />
</svelte:head>

<section class="mx-auto max-w-[720px] px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
	<p class="eyebrow" style="color: var(--color-amber);">Rechtliches</p>
	<h1 class="serif page-h1 mt-3" style="color: var(--color-ink); font-weight: 500;">Datenschutzerklärung</h1>

	<div class="mt-8 text-base leading-relaxed space-y-3" style="color: var(--color-ink-soft); font-family: var(--font-serif);">
		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">1. Verantwortlicher</h2>
		<p>
			Aaron Technologies OÜ, vertreten durch Aaron Julius Weege.
			<!-- TODO Aaron: estnische Adresse ergänzen, identisch zum Impressum -->
			Anschrift siehe <a href="/impressum" style="color: var(--color-amber);">Impressum</a>.
			Kontakt: <a href="mailto:admin@must-seen.com" style="color: var(--color-amber);">admin@must-seen.com</a>.
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">2. Grundsatz</h2>
		<p>
			Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung von NurEine
			erforderlich ist. NurEine setzt <strong>keine Werbe- oder Tracking-Cookies</strong> ein und
			verkauft keine Daten. Die Nutzung ist ohne Angabe personenbezogener Daten möglich; der
			Newsletter ist optional.
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">3. Newsletter (Double-Opt-in)</h2>
		<p>
			Trägst du dich für den Newsletter ein, speichern wir deine E-Mail-Adresse sowie zum Nachweis
			deiner Einwilligung den Zeitpunkt und die IP-Adresse der Anmeldung und Bestätigung. Die
			Anmeldung erfolgt im Double-Opt-in-Verfahren: Erst nach Klick auf den Bestätigungslink
			erhältst du den Newsletter. Rechtsgrundlage ist deine Einwilligung
			(Art. 6 Abs. 1 lit. a DSGVO). Du kannst sie jederzeit über den Abmeldelink in jeder E-Mail
			oder per Nachricht an uns widerrufen. Optional gespeicherte Themen-Präferenzen dienen
			ausschließlich der Personalisierung deines Newsletters.
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">4. Versanddienstleister Brevo</h2>
		<p>
			Den Newsletter-Versand wickeln wir über Brevo (Sendinblue GmbH bzw. Sendinblue SAS) als
			Auftragsverarbeiter ab. Brevo verarbeitet deine E-Mail-Adresse und Versand-/Öffnungs-/
			Klick-Statistiken in unserem Auftrag. Mit Brevo besteht ein Auftragsverarbeitungsvertrag
			(Art. 28 DSGVO).
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">5. Hosting &amp; Datenbank (Vercel, Supabase)</h2>
		<p>
			Die Website wird bei Vercel Inc. gehostet, Daten werden in einer Supabase-(PostgreSQL-)
			Datenbank gespeichert. Beim Aufruf der Seite werden technisch notwendige Server-Logs
			(u. a. gekürzte IP-Adresse, Zeitpunkt, abgerufene Seite) verarbeitet
			(Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an sicherem Betrieb). Mit beiden
			Anbietern bestehen Auftragsverarbeitungsverträge; eine Übermittlung in die USA erfolgt auf
			Grundlage der EU-Standardvertragsklauseln.
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">6. Reichweitenmessung (eigene Analyse)</h2>
		<p>
			Zur Verbesserung des Angebots erfassen wir anonymisierte Nutzungsereignisse (z. B.
			Seitenaufrufe) ohne Cookies und ohne personenbezogenes Profil. Es wird eine zufällige,
			nicht zu dir rückführbare Sitzungs-ID im lokalen Speicher deines Browsers abgelegt.
			Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO).
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">7. Standortbezogene Inhalte</h2>
		<p>
			Auf Seiten wie „Bei dir" kannst du freiwillig deinen ungefähren Standort verwenden. Erteilst
			du die Browser-Standortfreigabe nicht, ermitteln wir die Region näherungsweise über den
			Dienst ip-api.com anhand deiner IP-Adresse. Die Koordinaten werden nur lokal in deinem
			Browser gespeichert, nicht bei uns. Rechtsgrundlage: deine Einwilligung bzw. berechtigtes
			Interesse an lokalem Inhalt.
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">8. Google Reader Revenue Manager</h2>
		<p>
			Wir binden den Dienst „Reader Revenue Manager" der Google Ireland Ltd. ein
			(swg-basic.js). Er dient der Anbindung an Google News/Discover. Dabei kann Google
			technische Verbindungsdaten verarbeiten. Rechtsgrundlage: berechtigtes Interesse an
			Reichweite (Art. 6 Abs. 1 lit. f DSGVO). Details:
			<a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style="color: var(--color-amber);">policies.google.com/privacy</a>.
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">9. Deine Rechte</h2>
		<p>
			Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
			Datenübertragbarkeit und Widerspruch sowie das Recht, eine erteilte Einwilligung jederzeit
			zu widerrufen. Es besteht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde.
			Wende dich für alle Anliegen an <a href="mailto:admin@must-seen.com" style="color: var(--color-amber);">admin@must-seen.com</a>.
		</p>

		<h2 class="display text-lg mt-8" style="color: var(--color-ink); font-weight: 600;">10. Speicherdauer</h2>
		<p>
			Newsletter-Daten speichern wir, bis du dich abmeldest bzw. deine Einwilligung widerrufst.
			Server-Logs werden nach kurzer Zeit automatisch gelöscht oder anonymisiert.
		</p>

		<p class="mt-10 text-sm" style="color: var(--color-muted);">
			Stand: Juni 2026. Hinweis: Diese Datenschutzerklärung ist ein sorgfältig erstelltes Gerüst
			auf Basis der tatsächlich eingesetzten Dienste, ersetzt aber keine individuelle
			Rechtsberatung. Vor dem produktiven Einsatz bitte Firmenangaben vervollständigen und
			prüfen lassen.
		</p>
	</div>
</section>
