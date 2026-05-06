<script lang="ts">
	import { base } from '$app/paths';
</script>

<footer class="mt-32 border-t" style="border-color: var(--color-rule);">
	<div class="mx-auto max-w-[1180px] px-6 lg:px-10 py-16">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-12">
			<div class="md:col-span-2">
				<p class="serif text-2xl leading-tight" style="color: var(--color-ink);">
					Eine Geschichte am Tag.
					<br />
					<span style="color: var(--color-amber);">Mehr nicht.</span>
				</p>
				<p class="mt-4 text-sm leading-relaxed max-w-md" style="color: var(--color-muted);">
					NurEine filtert tausende Quellen mit KI auf das Wesentliche: Geschichten, die zeigen,
					dass die Welt voranschreitet. Keine Algorithmen, die dich länger halten. Keine Push-Nachrichten,
					die dich aus dem Schlaf reißen.
				</p>
			</div>
			<div>
				<h3 class="text-xs uppercase tracking-[0.18em]" style="color: var(--color-faint);">
					Entdecken
				</h3>
				<ul class="mt-4 space-y-2 text-sm">
					<li><a class="hover:opacity-70" href={base + '/archiv'}>Archiv</a></li>
					<li><a class="hover:opacity-70" href={base + '/karte'}>Karte der Hoffnung</a></li>
					<li><a class="hover:opacity-70" href={base + '/bei-dir'}>Gute Nachrichten vor Ort</a></li>
					<li><a class="hover:opacity-70" href={base + '/preise'}>Preise & Abos</a></li>
				</ul>
			</div>
			<div>
				<h3 class="text-xs uppercase tracking-[0.18em]" style="color: var(--color-faint);">
					Mitmachen
				</h3>
				<ul class="mt-4 space-y-2 text-sm">
					<li><a class="hover:opacity-70" href={base + '/bei-dir'}>Story einreichen</a></li>
					<li><a class="hover:opacity-70" href={base + '/newsletter'}>Newsletter</a></li>
					<li><a class="hover:opacity-70" href={base + '/manifest'}>Manifest</a></li>
				</ul>
			</div>
		</div>

		<div
			class="mt-14 pt-8 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs"
			style="border-color: var(--color-rule); color: var(--color-faint);"
		>
			<p>© 2026 NurEine. Veröffentlicht in Teltow, Brandenburg.</p>
			<p>
				Quellen: Reuters Solutions · Mongabay · WHO · Nature · Good News Network · Positive.News ·
				lokale Redaktionen
			</p>
		</div>
	</div>
</footer>
