<script lang="ts">
	import { addDays, isoOf, short, total, whole, type Day } from '#lib/usage.js';

	/** The last 30 days, a bar each, as tall as what was spent that day. Under the pointer, what it was made of. */
	let { days, today }: { days: Day[]; today: Date } = $props();

	const N = 30;
	const by = $derived(new Map(days.map((d) => [d.date, d])));
	const bars = $derived(
		Array.from({ length: N }, (_, i) => {
			const date = addDays(today, i - N + 1);
			return { date, day: by.get(isoOf(date)) };
		})
	);
	const most = $derived(Math.max(1, ...bars.map((b) => (b.day ? total(b.day) : 0))));

	const label = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	const tip = (b: (typeof bars)[number]) => {
		const when = b.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
		if (!b.day) return `Nothing on ${when}`;
		const d = b.day;
		return `${when}: ${short(total(d))} tokens — ${short(d.cache_read)} read from cache, ${short(d.cache_write)} cached, ${short(d.output)} out, ${short(d.input)} in · ${whole(d.messages)} responses in ${d.sessions} ${d.sessions === 1 ? 'session' : 'sessions'}`;
	};
</script>

<div class="relative">
	<div class="absolute top-0 left-0 text-[11px] text-muted-foreground tabular-nums">{short(most)}</div>
	<!-- The bars stand on a hairline; each is the whole of its column's height to the pointer, so a short one is as easy to reach. -->
	<div class="flex h-36 items-end gap-[2px] border-b border-border pt-5">
		{#each bars as b}
			<div class="flex h-full flex-1 items-end" data-tip={tip(b)} aria-label={tip(b)}>
				{#if b.day}
					<div class="w-full rounded-t-[4px] bg-[var(--brand)]" style="height: max(2px, {(total(b.day) / most) * 100}%)"></div>
				{/if}
			</div>
		{/each}
	</div>
	<div class="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
		<span>{label(bars[0].date)}</span>
		<span>Today</span>
	</div>
</div>
