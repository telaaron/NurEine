<script lang="ts">
	import { base } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import ShareBar from '$lib/components/ShareBar.svelte';
	import { showSensitive, toggleSensitive } from '$lib/sensitive';
	import { CameraIcon } from 'heroicons-svelte/24/outline';

	const siteUrl = 'https://nureine.de';
</script>

<footer class="mt-16 sm:mt-24 lg:mt-32 border-t" style="border-color: var(--color-rule);">
	<div class="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10 py-8 sm:py-12 lg:py-16">
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
			<div class="sm:col-span-2 md:col-span-2">
				<p class="serif text-xl sm:text-2xl leading-tight" style="color: var(--color-ink);">
					Eine Geschichte am Tag.
					<br />
					<span style="color: var(--color-amber);">Mehr nicht.</span>
				</p>
				<p class="mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed max-w-md" style="color: var(--color-muted);">
					NurEine filtert tausende Quellen mit KI auf das Wesentliche: Geschichten, die zeigen,
					dass die Welt voranschreitet. Keine Algorithmen, die dich länger halten. Keine Push-Nachrichten,
					die dich aus dem Schlaf reißen.
				</p>
			</div>
			<div>
				<h3 class="footer-heading" style="color: var(--color-faint);">
					Entdecken
				</h3>
				<ul class="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-sm">
					<li><a class="hover:opacity-70" href={base + '/warum'}>Warum NurEine?</a></li>
					<li><a class="hover:opacity-70" href={base + '/werte'}>Unsere Werte</a></li>
					<li><a class="hover:opacity-70" href={base + '/redaktion'}>So arbeiten wir</a></li>
					<li><a class="hover:opacity-70" href={base + '/roadmap'}>Roadmap & Feedback</a></li>
					<li><a class="hover:opacity-70" href={base + '/stand-der-welt'}>Der Stand der Welt</a></li>
					<li><a class="hover:opacity-70" href={base + '/archiv'}>Archiv</a></li>
					<li><a class="hover:opacity-70" href={base + '/karte'}>Karte der Hoffnung</a></li>
					<li><a class="hover:opacity-70" href={base + '/bei-dir'}>Gute Nachrichten vor Ort</a></li>
					<li><a class="hover:opacity-70" href={base + '/preise'}>Preise & Abos</a></li>
					<li><a class="hover:opacity-70" href={base + '/fuer-unternehmen'}>Für Unternehmen</a></li>
				</ul>
			</div>
			<div>
				<h3 class="footer-heading" style="color: var(--color-faint);">
					Mitmachen
				</h3>
				<ul class="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-sm">
					<li><a class="hover:opacity-70" href={base + '/teilen'}>Weiterempfehlen</a></li>
					<li><a class="hover:opacity-70" href={base + '/einreichen'}>Story einreichen</a></li>
					<li><a class="hover:opacity-70" href={base + '/newsletter'}>Newsletter</a></li>
					<li><a class="hover:opacity-70" href={base + '/manifest'}>Manifest</a></li>
					<li><a class="hover:opacity-70" href={base + '/methodik'}>Methodik</a></li>
					<li><a class="hover:opacity-70" href={base + '/unterstuetzer'}>Mitwirkende</a></li>
				</ul>
			</div>
			<div>
				<h3 class="footer-heading" style="color: var(--color-faint);">
					Gute Nachrichten
				</h3>
				<!--
					Diese Spalte verlinkt bewusst die /gute-nachrichten/*-Themen-Hubs (nicht die
					/archiv-Filter): Es sind die für Suche optimierten Landing-Pages ("Gute
					Nachrichten über Wissenschaft" etc.). Sie hingen bisher NUR an der XML-Sitemap
					→ Google-Status "Gefunden – zurzeit nicht indexiert". Ein sitewide-Footer-Link
					von der (indexierten) Startseite gibt Google einen echten Crawl-Pfad hinein.
				-->
				<ul class="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-sm">
					<li><a class="hover:opacity-70" href={base + '/gute-nachrichten/klima'}>Klima</a></li>
					<li><a class="hover:opacity-70" href={base + '/gute-nachrichten/gesundheit'}>Gesundheit</a></li>
					<li><a class="hover:opacity-70" href={base + '/gute-nachrichten/wissenschaft'}>Wissenschaft</a></li>
					<li><a class="hover:opacity-70" href={base + '/gute-nachrichten/tiere'}>Tiere</a></li>
					<li><a class="hover:opacity-70" href={base + '/gute-nachrichten/innovation'}>Innovation</a></li>
					<li><a class="hover:opacity-70" href={base + '/gute-nachrichten/land/deutschland'}>aus Deutschland</a></li>
					<li><a class="hover:opacity-70" href={base + '/gute-nachrichten-app'}>Good-News-App</a></li>
				</ul>
			</div>
		</div>

		<div
			class="meta mt-8 sm:mt-10 lg:mt-14 pt-5 sm:pt-6 lg:pt-8 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
			style="border-color: var(--color-rule); color: var(--color-faint);"
		>
			<div class="flex items-center gap-4 flex-wrap">
				<p>&copy; 2026 NurEine. Ver&ouml;ffentlicht in Teltow, Brandenburg.</p>
				<span class="flex items-center gap-3">
					<a class="hover:opacity-70" href={base + '/impressum'}>Impressum</a>
					<a class="hover:opacity-70" href={base + '/datenschutz'}>Datenschutz</a>
					<a class="hover:opacity-70" href={base + '/nutzungsbedingungen'}>Nutzungsbedingungen</a>
				</span>
				<a
					href="https://instagram.com/nureine.de"
					target="_blank"
					rel="noreferrer noopener"
					class="inline-flex items-center gap-1.5 hover:opacity-70"
					style="color: var(--color-amber);"
					aria-label="NurEine auf Instagram"
				>
					<Icon icon={CameraIcon} size="14px" />
					<span>@nureine.de</span>
				</a>
				<span class="hidden sm:inline-flex">
					<ShareBar url={siteUrl} title="NurEine — Gute Nachrichten. Jeden Tag eine." text="Eine Geschichte am Tag. Mehr nicht. Anti-Doomscroll aus Teltow, Brandenburg." size={15} />
				</span>
			</div>
			<div class="flex flex-col gap-2 sm:items-end">
				<button
					type="button"
					onclick={toggleSensitive}
					class="inline-flex items-center gap-2 hover:opacity-80"
					title="Sensible Inhalte (heikle Themen) ein- oder ausblenden"
				>
					<span class="relative inline-flex items-center" style="width:34px;height:18px;border-radius:9999px;background:{$showSensitive ? 'var(--color-amber)' : 'var(--color-rule-strong)'};transition:background 0.2s;">
						<span class="absolute" style="width:14px;height:14px;border-radius:9999px;background:#fff;top:2px;left:{$showSensitive ? '18px' : '2px'};transition:left 0.2s;"></span>
					</span>
					<span>Sensible Inhalte ungefiltert {$showSensitive ? 'an' : 'aus'}</span>
				</button>
				<p class="leading-relaxed">
					Quellen: Reuters Solutions &middot; Mongabay &middot; WHO &middot; Nature &middot; Good News Network &middot; Positive.News &middot;
					lokale Redaktionen
				</p>
			</div>
		</div>
	</div>
</footer>
