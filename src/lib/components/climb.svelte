<script lang="ts">
	import { short } from '#lib/usage.js';

	/**
	 * Everything so far, added up a day at a time from the first: a line that only goes up, stacked from its parts
	 * (the most at the bottom), so how fast it climbed is how steep it is. Under the pointer the day nearest it is
	 * marked, and the page is told which it is.
	 */
	let {
		points,
		colors,
		fmt = short,
		ticks,
		onpoint
	}: {
		/** Each day's running total of each part, oldest first. */
		points: number[][];
		colors: string[];
		fmt?: (n: number) => string;
		ticks: { at: number; label: string }[];
		onpoint: (i: number | null, at?: DOMRect) => void;
	} = $props();

	const W = 1000;
	const H = 200;
	const top = $derived(Math.max(0, ...points.map((p) => p.reduce((a, b) => a + b, 0))) || 1);
	const x = (i: number) => (points.length < 2 ? W / 2 : (i / (points.length - 1)) * W);
	const y = (n: number) => H - (n / top) * H;

	// Each part's band, bottom up: the line along its top, and back along the top of the one under it.
	const bands = $derived.by(() => {
		const under = points.map(() => 0);
		return colors.map((color, j) => {
			const lo = [...under];
			points.forEach((p, i) => (under[i] += p[j] ?? 0));
			const hi = [...under];
			const up = hi.map((n, i) => `${x(i)},${y(n)}`).join(' L');
			const down = lo.map((n, i) => `${x(i)},${y(n)}`).reverse().join(' L');
			return { color, d: `M${up} L${down} Z`, line: `M${up}` };
		});
	});

	let box = $state<SVGSVGElement>();
	let lit = $state<number | null>(null);
	function move(e: PointerEvent) {
		if (!box || !points.length) return;
		const r = box.getBoundingClientRect();
		const i = Math.round(((e.clientX - r.left) / r.width) * (points.length - 1));
		const at = Math.min(points.length - 1, Math.max(0, i));
		if (at === lit) return;
		lit = at;
		const px = r.left + (x(at) / W) * r.width;
		const py = r.top + (y(points[at].reduce((a, b) => a + b, 0)) / H) * r.height;
		onpoint(at, new DOMRect(px - 4, py - 4, 8, 8));
	}
</script>

<div class="relative">
	<div class="absolute top-0 left-0 text-[11px] text-muted-foreground">{fmt(top)}</div>
	<div class="pt-5">
		<svg
			bind:this={box}
			viewBox="0 0 {W} {H}"
			preserveAspectRatio="none"
			class="block h-36 w-full touch-none overflow-visible border-b border-border"
			role="img"
			aria-label="Everything so far, added up a day at a time"
			onpointermove={move}
			onpointerdown={move}
			onpointerleave={() => onpoint((lit = null))}
		>
			{#each bands as b}
				<path d={b.d} fill="color-mix(in oklab, {b.color} 75%, var(--card))" />
			{/each}
			<!-- One line, along the top of it all: a line a part, drawn in turn, left the last part's color all along the top. -->
			{#if bands.length}
				<path d={bands[bands.length - 1].line} fill="none" stroke="var(--foreground)" stroke-opacity="0.55" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
			{/if}
			{#if lit !== null}
				<line x1={x(lit)} x2={x(lit)} y1="0" y2={H} stroke="var(--foreground)" stroke-opacity="0.25" vector-effect="non-scaling-stroke" />
			{/if}
		</svg>
	</div>
	<div class="relative mt-1.5 h-4 text-[11px] text-muted-foreground">
		{#each ticks as t}
			<span
				class="absolute whitespace-nowrap"
				style={t.at === 0 ? 'left: 0' : t.at === points.length - 1 ? 'right: 0' : `left: ${(x(t.at) / W) * 100}%; transform: translateX(-50%)`}
				>{t.label}</span
			>
		{/each}
	</div>
</div>
