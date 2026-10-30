<script lang="ts">
	import { addDays, dateOf, isoOf, short, total, whole, type Day } from '#lib/usage.js';

	/**
	 * A year of days, a square each, a week to a column, as GitHub draws what you have committed. How deep the
	 * green is says how much was spent that day, in five steps: none, and the four quarters of the days that
	 * had any. Quarters and not equal slices of the most: one huge day would otherwise leave every other day pale.
	 */
	let { days, today }: { days: Day[]; today: Date } = $props();

	const WEEKS = 53;
	const by = $derived(new Map(days.map((d) => [d.date, d])));

	// Where each step begins: the quarter marks of the days that had anything.
	const cuts = $derived.by(() => {
		const sorted = days.map(total).filter((n) => n > 0).sort((a, b) => a - b);
		if (!sorted.length) return [Infinity, Infinity, Infinity];
		return [0.25, 0.5, 0.75].map((q) => sorted[Math.floor(q * (sorted.length - 1))]);
	});
	// One hue, the app's own, from the page's color to its full depth: mixed from the two, so it is right on a light
	// page and a dark one, and on every look, without a second set of steps. (Said here and not as classes: a class
	// built from a number is one Svelte cannot see, and it threw the rules away as unused.)
	const STEPS = [
		'color-mix(in oklab, var(--foreground) 7%, transparent)',
		'color-mix(in oklab, var(--brand) 30%, var(--card))',
		'color-mix(in oklab, var(--brand) 55%, var(--card))',
		'color-mix(in oklab, var(--brand) 80%, var(--card))',
		'var(--brand)'
	];
	const step = (n: number) => (n <= 0 ? 0 : 1 + cuts.filter((c) => n > c).length);

	// Columns end with this week; a column runs Sunday to Saturday.
	const first = $derived(addDays(today, -today.getDay() - (WEEKS - 1) * 7));
	const weeks = $derived(
		Array.from({ length: WEEKS }, (_, w) =>
			Array.from({ length: 7 }, (_, d) => {
				const date = addDays(first, w * 7 + d);
				const iso = isoOf(date);
				return { date, iso, day: by.get(iso), later: date > today };
			})
		)
	);
	// A month is named over the first column that has its first day.
	const months = $derived(weeks.map((w, i) => (i > 0 && w.some((c) => c.date.getDate() === 1) ? w.find((c) => c.date.getDate() === 1)!.date.toLocaleString('en-US', { month: 'short' }) : '')));

	const tip = (c: (typeof weeks)[number][number]) => {
		const when = c.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
		if (!c.day) return `Nothing on ${when}`;
		return `${short(total(c.day))} tokens on ${when} · ${whole(c.day.messages)} responses`;
	};

	// Scrolled to the end where the window is narrow: the weeks that matter most are the latest.
	let box = $state<HTMLElement>();
	$effect(() => {
		if (box) box.scrollLeft = box.scrollWidth;
	});
</script>

<div bind:this={box} class="overflow-x-auto [scrollbar-width:none]">
	<div class="grid w-max grid-cols-[auto_1fr] gap-x-2 text-[11px] text-muted-foreground">
		<div></div>
		<div class="flex gap-[3px]">
			{#each months as m}
				<div class="h-4 w-[11px] overflow-visible whitespace-nowrap">{m}</div>
			{/each}
		</div>
		<div class="grid grid-rows-7 gap-[3px] leading-[11px]">
			{#each ['', 'Mon', '', 'Wed', '', 'Fri', ''] as d}
				<div class="h-[11px]">{d}</div>
			{/each}
		</div>
		<div class="flex gap-[3px]">
			{#each weeks as week}
				<div class="grid grid-rows-7 gap-[3px]">
					{#each week as c}
						{#if c.later}
							<div class="size-[11px]"></div>
						{:else}
							<div class="size-[11px] rounded-[3px]" style="background: {STEPS[c.day ? step(total(c.day)) : 0]}" data-tip={tip(c)} aria-label={tip(c)}></div>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>

<div class="mt-3 flex items-center justify-end gap-[3px] text-[11px] text-muted-foreground">
	<span class="mr-1">Less</span>
	{#each [0, 1, 2, 3, 4] as s}
		<div class="size-[11px] rounded-[3px]" style="background: {STEPS[s]}"></div>
	{/each}
	<span class="ml-1">More</span>
</div>

