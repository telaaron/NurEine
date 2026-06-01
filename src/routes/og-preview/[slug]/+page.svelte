<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { story, og } = data;
</script>

<div class="container">
	<h1>OG Image Preview — {story.title}</h1>

	<div class="preview-section">
		<h2>1x Preview (1200x630)</h2>
		<img src={og["1x"].png} alt="OG 1x PNG" class="preview" />
	</div>

	<div class="preview-section">
		<h2>2x Preview (2400x1260)</h2>
		<img src={og["2x"].png} alt="OG 2x PNG" class="preview preview-2x" />
	</div>

	<div class="info-section">
		<h2>Image Details</h2>
		<table>
			<thead>
				<tr>
					<th>Format</th>
					<th>1x (1200x630)</th>
					<th>2x (2400x1260)</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>PNG</strong></td>
					<td>
						{#if og["1x"].png}
							<a href={og["1x"].png} target="_blank">Download</a>
						{/if}
					</td>
					<td>
						{#if og["2x"].png}
							<a href={og["2x"].png} target="_blank">Download</a>
						{/if}
					</td>
				</tr>
				<tr>
					<td><strong>WebP</strong></td>
					<td>
						{#if og["1x"].webp}
							<a href={og["1x"].webp} target="_blank">Download</a>
						{:else}
							N/A
						{/if}
					</td>
					<td>
						{#if og["2x"].webp}
							<a href={og["2x"].webp} target="_blank">Download</a>
						{:else}
							N/A
						{/if}
					</td>
				</tr>
				<tr>
					<td><strong>AVIF</strong></td>
					<td>
						{#if og["1x"].avif}
							<a href={og["1x"].avif} target="_blank">Download</a>
						{:else}
							N/A
						{/if}
					</td>
					<td>
						{#if og["2x"].avif}
							<a href={og["2x"].avif} target="_blank">Download</a>
						{:else}
							N/A
						{/if}
					</td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="meta-section">
		<h2>Responsive Image Meta Tags</h2>
		<pre><code>&lt;img
  src="{og['1x'].png}"
  srcset="
    {og['1x'].webp} 1x w,
    {og['2x'].webp} 2x w"
  sizes="1200px"
  alt="{story.title}"
/&gt;</code></pre>
	</div>

	<div class="meta-section">
		<h2>Social Media Meta Tags</h2>
		<pre><code>&lt;meta property="og:image" content="{og['1x'].png}" /&gt;
&lt;meta property="og:image:width" content="1200" /&gt;
&lt;meta property="og:image:height" content="630" /&gt;
&lt;meta property="og:image:type" content="image/png" /&gt;

&lt;meta property="twitter:image" content="{og['1x'].png}" /&gt;
&lt;meta property="twitter:card" content="summary_large_image" /&gt;</code></pre>
	</div>
</div>

<style>
	.container {
		max-width: 1400px;
		margin: 2rem auto;
		padding: 0 1rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	h1 {
		color: #1a1815;
		margin-bottom: 2rem;
		border-bottom: 2px solid #c87340;
		padding-bottom: 1rem;
	}

	h2 {
		color: #333;
		margin-top: 2rem;
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}

	.preview-section {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: #f5f1ea;
		border-radius: 8px;
	}

	.preview {
		max-width: 100%;
		height: auto;
		border: 1px solid #ddd;
		border-radius: 4px;
		display: block;
	}

	.preview-2x {
		max-width: 50%;
	}

	.info-section,
	.meta-section {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: #f9f7f3;
		border-radius: 8px;
		border-left: 4px solid #c87340;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}

	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}

	th {
		background: #f5f1ea;
		font-weight: 600;
		color: #1a1815;
	}

	a {
		color: #c87340;
		text-decoration: none;
		font-weight: 500;
	}

	a:hover {
		text-decoration: underline;
	}

	pre {
		background: #1a1815;
		color: #f5f1ea;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.875rem;
	}

	code {
		font-family: 'Menlo', 'Monaco', monospace;
	}

	@media (max-width: 768px) {
		.preview-2x {
			max-width: 100%;
		}

		table {
			font-size: 0.875rem;
		}

		th,
		td {
			padding: 0.5rem;
		}
	}
</style>
