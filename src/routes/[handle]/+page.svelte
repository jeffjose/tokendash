<script lang="ts">
	import Year from '#lib/components/year.svelte';
	import Month from '#lib/components/month.svelte';
	import { CARD, HEADING, ROWS } from '#lib/styles.js';
	import { addDays, dateOf, isoOf, modelName, short, streaks, total, whole } from '#lib/usage.js';

	let { data } = $props();
	const u = $derived(data.usage);

	// Today on the clock the days were counted on, so a day is not cut at someone else's midnight.
	const today = $derived(dateOf(new Intl.DateTimeFormat('en-CA', { timeZone: u.zone }).format(new Date())));
	const all = $derived(u.days.reduce((n, d) => n + total(d), 0));
	const since = $derived(isoOf(addDays(today, -29)));
	const month = $derived(u.days.filter((d) => d.date >= since).reduce((n, d) => n + total(d), 0));
	const busiest = $derived(u.days.reduce((a, d) => (total(d) > total(a) ? d : a), u.days[0]));
	const run = $derived(streaks(u.days, today));
	const responses = $derived(u.days.reduce((n, d) => n + d.messages, 0));
	const kinds = $derived([
		{ name: 'Read from cache', n: u.days.reduce((n, d) => n + d.cache_read, 0) },
		{ name: 'Written to cache', n: u.days.reduce((n, d) => n + d.cache_write, 0) },
		{ name: 'Written out', n: u.days.reduce((n, d) => n + d.output, 0) },
		{ name: 'Read in', n: u.days.reduce((n, d) => n + d.input, 0) }
	]);
	const modelsTotal = $derived(u.models.reduce((n, m) => n + total(m), 0));

	// A part of the whole too small to say as a whole number is said to a tenth, and one too small for that as under it.
	const percent = (f: number) => (f >= 0.01 ? `${Math.round(f * 100)}%` : f >= 0.001 ? `${(f * 100).toFixed(1)}%` : '<0.1%');
	const day = (iso: string) => dateOf(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	function ago(iso: string): string {
		const s = (Date.now() - new Date(iso).getTime()) / 1000;
		if (s < 60) return 'just now';
		if (s < 3600) return `${Math.floor(s / 60)} min ago`;
		if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
		return `${Math.floor(s / 86400)} d ago`;
	}
</script>

<svelte:head>
	<title>{u.handle} · tokendash</title>
</svelte:head>

<main class="mx-auto flex max-w-[880px] flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
	<header class="flex items-center gap-4">
		<img src="https://github.com/{u.handle}.png?size=128" alt="" class="size-16 rounded-full bg-muted ring-1 ring-foreground/10" />
		<div class="min-w-0">
			<h1 class="truncate text-[22px] font-medium tracking-tight">{u.handle}</h1>
			<p class="text-[13px] text-muted-foreground">
				Claude Code since {day(u.days[0].date)} ·
				<span data-tip={new Date(u.generated_at).toLocaleString('en-US')}>counted {ago(u.generated_at)}</span>
			</p>
		</div>
	</header>

	<section class="grid grid-cols-2 sm:grid-cols-4 {CARD} divide-foreground/10 max-sm:[&>*:nth-child(-n+2)]:border-b max-sm:[&>*]:border-foreground/10 sm:divide-x">
		{@render tile('Tokens', short(all), `${whole(responses)} responses`, whole(all))}
		{@render tile('Last 30 days', short(month), `${Math.round((month / Math.max(all, 1)) * 100)}% of it all`, whole(month))}
		{@render tile('Busiest day', short(total(busiest)), day(busiest.date), whole(total(busiest)))}
		{@render tile('Days in a row', String(run.now), `${run.longest} at the most`)}
	</section>

	<section class="flex flex-col gap-3">
		<h2 class={HEADING}>The year</h2>
		<div class="{CARD} p-5"><Year days={u.days} {today} /></div>
	</section>

	<section class="flex flex-col gap-3">
		<h2 class={HEADING}>The last 30 days</h2>
		<div class="{CARD} p-5"><Month days={u.days} {today} /></div>
	</section>

	<div class="grid gap-6 sm:grid-cols-2">
		<section class="flex flex-col gap-3">
			<h2 class={HEADING}>By model</h2>
			<div class={ROWS}>
				{#each u.models as m}
					{@render share(modelName(m.model), total(m), modelsTotal, `${m.model} · ${whole(m.messages)} responses`)}
				{/each}
			</div>
		</section>
		<section class="flex flex-col gap-3">
			<h2 class={HEADING}>What the tokens were</h2>
			<div class={ROWS}>
				{#each kinds as k}
					{@render share(k.name, k.n, all, `${whole(k.n)} tokens`)}
				{/each}
			</div>
		</section>
	</div>
</main>

{#snippet tile(name: string, value: string, note: string, exact?: string)}
	<div class="flex flex-col gap-1 p-5">
		<div class="text-[12px] text-muted-foreground">{name}</div>
		<div class="text-[28px] font-medium tracking-tight tabular-nums" data-tip={exact}>{value}</div>
		<div class="truncate text-[12px] text-muted-foreground">{note}</div>
	</div>
{/snippet}

<!-- A row: what it is, how much, and a bar under it for its part of the whole. -->
{#snippet share(name: string, n: number, of: number, tip: string)}
	<div class="flex flex-col gap-2 px-4 py-3" data-tip={tip}>
		<div class="flex items-baseline justify-between gap-3 text-[14px]">
			<span class="truncate">{name}</span>
			<span class="shrink-0 text-[13px] text-muted-foreground tabular-nums">{short(n)} · {percent(n / Math.max(of, 1))}</span>
		</div>
		<div class="h-1 overflow-hidden rounded-full bg-foreground/[0.07]">
			<div class="h-full rounded-full bg-[var(--brand)]" style="width: {Math.max(0.5, (n / Math.max(of, 1)) * 100)}%"></div>
		</div>
	</div>
{/snippet}
