<script lang="ts">
	import { base } from '$app/paths';
	import { formatDate } from '$lib/utils';

	let { data } = $props();
	const stories = $derived(data.stories);
</script>

<div class="flex items-center justify-between">
	<h1 class="display text-3xl" style="color: var(--color-ink); font-weight: 600;">Stories</h1>
	<a
		href={base + '/admin/stories/new'}
		class="px-4 py-2 rounded-full text-sm font-medium"
		style="background: var(--color-ink); color: var(--color-paper);"
	>
		+ Neue Story
	</a>
</div>

<div class="mt-6 space-y-2">
	{#each stories as story}
		<a
			href={base + '/admin/stories/' + story.id + '/edit'}
			class="paper block p-4 rounded-[10px] hover:opacity-90 transition-all"
			style="border: 1px solid var(--color-rule);"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium" style="color: var(--color-ink);">{story.title}</p>
					<p class="text-xs mt-1" style="color: var(--color-muted);">
						{story.category} · {story.country} · {formatDate(story.publishedAt)}
					</p>
				</div>
				<div class="text-right text-xs" style="color: var(--color-faint);">
					Wirkung {story.impactScore}/100
				</div>
			</div>
		</a>
	{/each}
</div>
