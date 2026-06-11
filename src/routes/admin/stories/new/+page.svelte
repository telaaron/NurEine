<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let title = $state('');
	let slug = $state('');
	let dek = $state('');
	let body = $state('');
	let category = $state('Klima');
	let region = $state('');
	let country = $state('');
	let coordsX = $state(50);
	let coordsY = $state(50);
	let source = $state('');
	let sourceUrl = $state('');
	let publishedAt = $state(new Date().toISOString().split('T')[0]);
	let readingMinutes = $state(3);
	let impactScore = $state(50);
	let impactNote = $state('');
	let tone = $state('amber');
	let imageUrl = $state('');
	let pinned = $state(false);
	let local = $state(false);
	let featuredDate = $state('');

	let saving = $state(false);
	let error = $state('');

	const categories = ['Klima', 'Gesundheit', 'Wissenschaft', 'Gemeinschaft', 'Tiere', 'Kultur', 'Innovation'];
	const tones = ['amber', 'sage', 'rose', 'sky'];

	function generateSlug() {
		slug = title
			.toLowerCase()
			.replace(/[^a-z0-9äöüß]+/g, '-')
			.replace(/^-|-$/g, '')
			.substring(0, 80);
	}

	async function submit() {
		saving = true;
		error = '';

		const res = await fetch(base + '/api/stories', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				slug: slug || undefined,
				title,
				dek,
				body,
				category,
				region,
				country,
				coordsX,
				coordsY,
				source,
				sourceUrl,
				publishedAt,
				readingMinutes,
				impactScore,
				impactNote,
				tone,
				imageUrl,
				pinned,
				local,
				featuredDate: featuredDate || null
			})
		});

		if (res.ok) {
			goto(base + '/admin/stories');
		} else {
			const data = await res.json();
			error = data.error || 'Fehler beim Speichern';
			saving = false;
		}
	}
</script>

<div class="flex items-center justify-between">
	<h1 class="serif text-2xl" style="color: var(--color-ink);">Neue Story</h1>
	<div class="flex gap-3">
		<a
			href={base + '/admin/stories'}
			class="px-4 py-2 rounded-full text-sm font-medium"
			style="border: 1px solid var(--color-rule); color: var(--color-ink-soft);"
		>
			Abbrechen
		</a>
		<button
			type="button"
			onclick={submit}
			disabled={saving}
			class="px-4 py-2 rounded-full text-sm font-medium"
			style="background: var(--color-ink); color: var(--color-paper);"
		>
			{saving ? 'Speichert…' : 'Story erstellen'}
		</button>
	</div>
</div>

{#if error}
	<div class="mt-4 p-3 rounded-[4px] text-sm" style="background: var(--color-rose); color: white;">
		{error}
	</div>
{/if}

<form onsubmit={(e) => { e.preventDefault(); submit(); }} class="mt-6 space-y-6 max-w-3xl">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="md:col-span-2">
			<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Titel</label>
			<input
				type="text"
				bind:value={title}
				oninput={generateSlug}
				class="w-full px-4 py-2.5 rounded-[10px] text-sm"
				style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				required
			/>
		</div>

		<div>
			<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Slug</label>
			<input
				type="text"
				bind:value={slug}
				class="w-full px-4 py-2.5 rounded-[10px] text-sm"
				style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink); font-family: monospace;"
			/>
		</div>

		<div>
			<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Datum</label>
			<input
				type="date"
				bind:value={publishedAt}
				class="w-full px-4 py-2.5 rounded-[10px] text-sm"
				style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
			/>
		</div>

		<div class="md:col-span-2">
			<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Dek (Untertitel)</label>
			<textarea
				bind:value={dek}
				class="w-full px-4 py-2.5 rounded-[10px] text-sm"
				style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				rows="2"
			></textarea>
		</div>

		<div class="md:col-span-2">
			<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Body (Storytext)</label>
			<textarea
				bind:value={body}
				class="w-full px-4 py-2.5 rounded-[10px] text-sm"
				style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink); font-family: monospace;"
				rows="12"
			></textarea>
			<p class="text-xs mt-1" style="color: var(--color-faint);">Einfacher Text oder HTML. Keine Markdown-Formatierung.</p>
		</div>
	</div>

	<fieldset class="border-t pt-6" style="border-color: var(--color-rule);">
		<legend class="text-xs uppercase tracking-[0.12em] px-2" style="color: var(--color-muted);">Metadaten</legend>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
			<div>
				<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Kategorie</label>
				<select
					bind:value={category}
					class="w-full px-4 py-2.5 rounded-[10px] text-sm"
					style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				>
					{#each categories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Tone/Color</label>
				<select
					bind:value={tone}
					class="w-full px-4 py-2.5 rounded-[10px] text-sm"
					style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				>
					{#each tones as t}
						<option value={t}>{t}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Bild-URL</label>
				<input
					type="text"
					bind:value={imageUrl}
					class="w-full px-4 py-2.5 rounded-[10px] text-sm"
					style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
					placeholder="https://xxx.supabase.co/storage/v1/object/public/story_images/..."
				/>
			</div>

			<div>
				<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Region</label>
				<input
					type="text"
					bind:value={region}
					placeholder="z. B. Europa"
					class="w-full px-4 py-2.5 rounded-[10px] text-sm"
					style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				/>
			</div>

			<div>
				<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Land</label>
				<input
					type="text"
					bind:value={country}
					placeholder="z. B. Deutschland"
					class="w-full px-4 py-2.5 rounded-[10px] text-sm"
					style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				/>
			</div>

			<div>
				<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Quelle</label>
				<input
					type="text"
					bind:value={source}
					placeholder="z. B. The Guardian"
					class="w-full px-4 py-2.5 rounded-[10px] text-sm"
					style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				/>
			</div>

			<div class="md:col-span-2">
				<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Quell-URL</label>
				<input
					type="url"
					bind:value={sourceUrl}
					placeholder="https://…"
					class="w-full px-4 py-2.5 rounded-[10px] text-sm"
					style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				/>
			</div>
		</div>
	</fieldset>

	<fieldset class="border-t pt-6" style="border-color: var(--color-rule);">
		<legend class="text-xs uppercase tracking-[0.12em] px-2" style="color: var(--color-muted);">Bewertung & Position</legend>
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
			<div>
				<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Impact Score</label>
				<input
					type="range"
					bind:value={impactScore}
					min="0"
					max="100"
					class="w-full"
				/>
				<p class="text-xs mt-1 text-right" style="color: var(--color-faint);">{impactScore}/100</p>
			</div>

			<div>
				<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Lesezeit (Min.)</label>
				<input
					type="number"
					bind:value={readingMinutes}
					min="1"
					max="30"
					class="w-full px-4 py-2.5 rounded-[10px] text-sm"
					style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				/>
			</div>

			<div>
				<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Koordinate X (Lng)</label>
				<input
					type="number"
					bind:value={coordsX}
					step="0.01"
					class="w-full px-4 py-2.5 rounded-[10px] text-sm"
					style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				/>
			</div>

			<div>
				<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Koordinate Y (Lat)</label>
				<input
					type="number"
					bind:value={coordsY}
					step="0.01"
					class="w-full px-4 py-2.5 rounded-[10px] text-sm"
					style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
				/>
			</div>
		</div>

		<div class="mt-4">
			<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Impact Note</label>
			<input
				type="text"
				bind:value={impactNote}
				placeholder="z. B. „120.000 Menschen profitieren“"
				class="w-full px-4 py-2.5 rounded-[10px] text-sm"
				style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
			/>
		</div>
	</fieldset>

	<fieldset class="border-t pt-6" style="border-color: var(--color-rule);">
		<legend class="text-xs uppercase tracking-[0.12em] px-2" style="color: var(--color-muted);">Status</legend>
		<div class="flex gap-6 mt-4">
			<label class="flex items-center gap-2 text-sm" style="color: var(--color-ink);">
				<input type="checkbox" bind:checked={pinned} />
				Angepinnt
			</label>
			<label class="flex items-center gap-2 text-sm" style="color: var(--color-ink);">
				<input type="checkbox" bind:checked={local} />
				Lokal (Bayern)
			</label>
		</div>
		<div class="mt-4">
			<label class="block text-xs uppercase tracking-[0.12em] mb-1" style="color: var(--color-muted);">Featured Datum (optional)</label>
			<input
				type="date"
				bind:value={featuredDate}
				class="w-full max-w-xs px-4 py-2.5 rounded-[10px] text-sm"
				style="border: 1px solid var(--color-rule); background: var(--color-paper); color: var(--color-ink);"
			/>
			<p class="text-xs mt-1" style="color: var(--color-faint);">Nur setzen, wenn die Story auf der Startseite vorgestellt werden soll.</p>
		</div>
	</fieldset>
</form>
