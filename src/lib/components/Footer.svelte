<script lang="ts">
	import { base } from '$app/paths';
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
				<h3 class="text-[11px] uppercase tracking-[0.18em]" style="color: var(--color-faint);">
					Entdecken
				</h3>
				<ul class="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-sm">
					<li><a class="hover:opacity-70" href={base + '/archiv'}>Archiv</a></li>
					<li><a class="hover:opacity-70" href={base + '/karte'}>Karte der Hoffnung</a></li>
					<li><a class="hover:opacity-70" href={base + '/bei-dir'}>Gute Nachrichten vor Ort</a></li>
					<li><a class="hover:opacity-70" href={base + '/preise'}>Preise & Abos</a></li>
				</ul>
			</div>
			<div>
				<h3 class="text-[11px] uppercase tracking-[0.18em]" style="color: var(--color-faint);">
					Mitmachen
				</h3>
				<ul class="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-sm">
					<li><a class="hover:opacity-70" href={base + '/bei-dir'}>Story einreichen</a></li>
					<li><a class="hover:opacity-70" href={base + '/newsletter'}>Newsletter</a></li>
					<li><a class="hover:opacity-70" href={base + '/manifest'}>Manifest</a></li>
				</ul>
			</div>
		</div>

		<div
			class="mt-8 sm:mt-10 lg:mt-14 pt-5 sm:pt-6 lg:pt-8 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 text-[11px] sm:text-xs"
			style="border-color: var(--color-rule); color: var(--color-faint);"
		>
			<p>&copy; 2026 NurEine. Ver&ouml;ffentlicht in Teltow, Brandenburg.</p>
			<p class="leading-relaxed">
				Quellen: Reuters Solutions &middot; Mongabay &middot; WHO &middot; Nature &middot; Good News Network &middot; Positive.News &middot;
				lokale Redaktionen
			</p>
		</div>
	</div>
</footer>
