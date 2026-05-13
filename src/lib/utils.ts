export function formatDate(iso: string, opts: 'short' | 'long' = 'long'): string {
	const d = new Date(iso);
	if (opts === 'short') {
		return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
	}
	return d.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	});
}

export function relTime(iso: string, now = new Date()): string {
	const d = new Date(iso);
	const ms = now.getTime() - d.getTime();
	const min = Math.floor(ms / 60000);
	const hr = Math.floor(min / 60);
	const day = Math.floor(hr / 24);
	if (min < 60) return `vor ${Math.max(1, min)} Min.`;
	if (hr < 24) return `vor ${hr} Std.`;
	if (day < 7) return `vor ${day} ${day === 1 ? 'Tag' : 'Tagen'}`;
	return formatDate(iso, 'short');
}

export function paragraphs(body: string): string[] {
	return body.trim().split(/\n\n+/);
}

export function inline(text: string): string {
	// **bold** -> <strong>, *italic* -> <em>
	return text
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export type Section = {
	heading: string;
	paras: string[];
};

/** Parse body into structured sections. Detects `## Heading` (markdown h2)
 *  or `**Heading**` (bold) followed by blank line as section boundaries.
 *  Content before the first heading becomes a lead section with empty heading. */
export function sections(body: string): Section[] {
	const blocks = body.trim().split(/\n\n+/);
	const result: Section[] = [];
	let current: Section | null = null;

	for (const block of blocks) {
		const trimmed = block.trim();
		// ## Heading or **Heading** (standalone line)
		const h2Match = trimmed.match(/^##\s+(.+)$/);
		const boldMatch = trimmed.match(/^\*\*(.+?)\*\*$/);

		if (h2Match || boldMatch) {
			const heading = (h2Match || boldMatch)![1];
			if (current && current.heading === '') {
				// Flush lead section
				result.push(current);
			} else if (current) {
				result.push(current);
			}
			current = { heading, paras: [] };
		} else if (current) {
			current.paras.push(trimmed);
		} else {
			// Content before first heading: lead section
			result.push({ heading: '', paras: [trimmed] });
			current = { heading: '', paras: [] };
		}
	}

	if (current) result.push(current);
	return result;
}

export const toneStyles: Record<
	'amber' | 'sage' | 'rose' | 'sky',
	{ fg: string; bg: string; ring: string }
> = {
	amber: {
		fg: 'var(--color-amber)',
		bg: 'var(--color-amber-tint)',
		ring: 'rgba(200, 115, 64, 0.3)'
	},
	sage: {
		fg: 'var(--color-sage)',
		bg: 'var(--color-sage-tint)',
		ring: 'rgba(90, 122, 82, 0.3)'
	},
	rose: {
		fg: 'var(--color-rose)',
		bg: 'var(--color-rose-tint)',
		ring: 'rgba(184, 122, 122, 0.3)'
	},
	sky: { fg: 'var(--color-sky)', bg: 'var(--color-sky-tint)', ring: 'rgba(108, 138, 168, 0.3)' }
};
