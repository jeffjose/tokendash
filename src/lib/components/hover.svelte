<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * What a mark in a chart is made of, over it while the pointer is on it. A hint (`data-tip`) is one line of
	 * words; a day is a total, its parts and what kind of tokens they were, which is a card. On the hint's own
	 * surface, the same in every look, so the two read as one thing at two sizes. It comes at once: a chart is
	 * read by sweeping across it, and a wait at each bar is a wait thirty times.
	 */
	let { at, below = false, children }: { at: DOMRect | null; below?: boolean; children: Snippet } = $props();

	let card = $state<HTMLElement>();
	let x = $state(0);
	let y = $state(0);

	// Above the mark, centered, or below it where the mark asks (a square of the year: above it is the tiles, which
	// the card stood on and hid); the other side when there is no room; kept 8px inside the window either way.
	$effect(() => {
		if (!at || !card) return;
		const w = card.offsetWidth;
		const h = card.offsetHeight;
		const over = at.top - h - 8;
		const under = at.bottom + 8;
		const fitsOver = over >= 8;
		const fitsUnder = under + h <= window.innerHeight - 8;
		x = Math.min(Math.max(8, at.left + at.width / 2 - w / 2), window.innerWidth - w - 8);
		y = (below ? fitsUnder || !fitsOver : !fitsOver) ? Math.min(under, window.innerHeight - h - 8) : over;
	});
</script>

{#if at}
	<div
		bind:this={card}
		role="tooltip"
		class="tip-in pointer-events-none fixed z-[100] w-max max-w-72 rounded-lg px-3 py-2.5 text-[12px] leading-snug"
		style="left: {x}px; top: {y}px; background: oklch(0.2 0.006 286); color: oklch(0.96 0.003 286); box-shadow: 0 0 0 1px oklch(1 0 0 / 0.1), 0 8px 24px -8px oklch(0 0 0 / 0.6)"
	>
		{@render children()}
	</div>
{/if}
