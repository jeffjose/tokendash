<script lang="ts">
	/**
	 * The week hour by hour: a row a day, Monday first, and a cell an hour, as deep as how many responses came in
	 * that hour on that day of the week, over every week there is. In five steps like the year (none, and the four
	 * quarters of the hours that had any), so one long night does not leave every other hour pale.
	 */
	let {
		grid,
		hue = 'var(--brand)',
		onpoint
	}: { grid: number[][]; hue?: string; onpoint: (at: { day: number; hour: number } | null, rect?: DOMRect) => void } = $props();

	const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const cuts = $derived.by(() => {
		const sorted = grid
			.flat()
			.filter((n) => n > 0)
			.sort((a, b) => a - b);
		if (!sorted.length) return [Infinity, Infinity, Infinity];
		return [0.25, 0.5, 0.75].map((q) => sorted[Math.floor(q * (sorted.length - 1))]);
	});
	const STEPS = $derived([
		'color-mix(in oklab, var(--foreground) 7%, transparent)',
		`color-mix(in oklab, ${hue} 30%, var(--card))`,
		`color-mix(in oklab, ${hue} 55%, var(--card))`,
		`color-mix(in oklab, ${hue} 80%, var(--card))`,
		hue
	]);
	const step = (n: number) => (n <= 0 ? 0 : 1 + cuts.filter((c) => n > c).length);

	let lit = $state<string | null>(null);
	function over(e: PointerEvent) {
		const el = (e.target as HTMLElement).closest<HTMLElement>('[data-at]');
		const at = el?.dataset.at ?? null;
		if (at === lit) return;
		lit = at;
		if (!el || !at) return onpoint(null);
		const [day, hour] = at.split(':').map(Number);
		onpoint({ day, hour }, el.getBoundingClientRect());
	}
</script>

<div class="grid grid-cols-[auto_1fr] gap-x-2 text-[11px] text-muted-foreground">
	<div class="grid grid-rows-7 gap-[3px]">
		{#each DAYS as d, i}
			<div class="flex items-center leading-none">{i % 2 === 0 ? d : ''}</div>
		{/each}
	</div>
	<div class="grid grid-rows-7 gap-[3px]" role="grid" tabindex="-1" onpointerover={over} onpointerleave={() => onpoint((lit = null))}>
		{#each grid as row, day}
			<div class="grid grid-cols-24 gap-[3px]" role="row">
				{#each row as n, hour}
					<div
						class="h-4 w-full rounded-[3px] sm:h-[18px] {lit === `${day}:${hour}` ? 'ring-1 ring-foreground/60' : ''}"
						style="background: {STEPS[step(n)]}"
						data-at="{day}:{hour}"
						role="gridcell"
						aria-label="{DAYS[day]} {hour}:00, {n} responses"
					></div>
				{/each}
			</div>
		{/each}
	</div>
	<div></div>
	<div class="relative mt-1.5 h-4">
		{#each [0, 6, 12, 18] as h}
			<span class="absolute whitespace-nowrap" style="left: {(h / 24) * 100}%">{h % 12 || 12} {h < 12 ? 'AM' : 'PM'}</span>
		{/each}
	</div>
</div>
