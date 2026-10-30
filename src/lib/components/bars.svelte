<script lang="ts">
	import { short } from '#lib/usage.js';

	/**
	 * A row of bars standing on a hairline, each as tall as its total and stacked from its parts, the most at the
	 * bottom. Each bar's column is the whole height to the pointer, so a short one is as easy to reach. Under the
	 * pointer the column is lit, and the page is told which it is, to say what it was made of.
	 */
	let {
		bars,
		colors,
		ticks,
		height = 'h-36',
		gap = 'gap-[2px]',
		onpoint
	}: {
		bars: { parts: number[]; label: string }[];
		colors: string[];
		/** Words under the bars: each at the bar it is under. */
		ticks: { at: number; label: string }[];
		height?: string;
		gap?: string;
		onpoint: (i: number | null, at?: DOMRect) => void;
	} = $props();

	const totals = $derived(bars.map((b) => b.parts.reduce((n, p) => n + p, 0)));
	const most = $derived(Math.max(1, ...totals));
	let lit = $state<number | null>(null);

	function point(i: number | null, el?: HTMLElement) {
		lit = i;
		onpoint(i, el?.getBoundingClientRect());
	}
</script>

<div class="relative">
	<div class="absolute top-0 left-0 text-[11px] text-muted-foreground">{short(most)}</div>
	<div class="flex {height} items-end {gap} border-b border-border pt-5" role="list" onpointerleave={() => point(null)}>
		{#each bars as b, i}
			<div
				role="listitem"
				aria-label={b.label}
				class="flex h-full min-w-0 flex-1 flex-col-reverse rounded-t-[4px] transition-colors {lit === i ? 'bg-foreground/[0.05]' : ''}"
				onpointerenter={(e) => point(i, e.currentTarget)}
			>
				{#if totals[i] > 0}
					<!-- The parts, bottom up; the bar's own corners are the top part's, and it is never under 2px so a small day shows. -->
					<div class="flex w-full flex-col-reverse overflow-hidden rounded-t-[4px]" style="height: max(2px, {(totals[i] / most) * 100}%)">
						{#each b.parts as p, j}
							{#if p > 0}
								<div style="flex: {p} 0 0; background: {colors[j]}"></div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
	<div class="relative mt-1.5 h-4 text-[11px] text-muted-foreground">
		{#each ticks as t}
			{@const edge = t.at === 0 ? 'left' : t.at === bars.length - 1 ? 'right' : 'mid'}
			<span
				class="absolute whitespace-nowrap"
				style={edge === 'left' ? 'left: 0' : edge === 'right' ? 'right: 0' : `left: ${((t.at + 0.5) / bars.length) * 100}%; transform: translateX(-50%)`}
				>{t.label}</span
			>
		{/each}
	</div>
</div>
