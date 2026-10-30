<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import AppearanceMenu from '#lib/components/appearance-menu.svelte';
	import Bars from '#lib/components/bars.svelte';
	import Breakdown from '#lib/components/breakdown.svelte';
	import Hover from '#lib/components/hover.svelte';
	import Mark from '#lib/components/mark.svelte';
	import Year from '#lib/components/year.svelte';
	import { SEG, SEG_ITEM, SEG_OFF, SEG_ON } from '#lib/seg.js';
	import { colorOf, fillOf, nameOf, partOf, seriesOf, SHADES, SPLITS, type Split } from '#lib/split.js';
	import { BTN, CARD, HEADING, ROWS } from '#lib/styles.js';
	import { addDays, dateOf, daysOf, group, isoOf, makerOf, modelName, money, PRICED, short, streaks, sum, toolName, total, whole, type Day, type Row, type Spent, type Tokens } from '#lib/usage.js';

	let { data } = $props();
	const u = $derived(data.usage);

	// Today on the clock the days were counted on, so a day is not cut at someone else's midnight.
	const today = $derived(dateOf(new Intl.DateTimeFormat('en-CA', { timeZone: u.zone }).format(new Date())));

	// Which tool the page is about: all of them, or one. In the address, so a page about one can be sent as that.
	const tools = $derived(group(u.rows, 'tool').map((t) => t.name));
	// (Kept here and written to the address, not read back from it: a change that does not navigate leaves `page.url` as it was.)
	let asked = $state(page.url.searchParams.get('tool'));
	const tool = $derived(asked && tools.includes(asked) ? asked : null);
	function only(t: string | null) {
		asked = t;
		const url = new URL(page.url.href);
		if (t) url.searchParams.set('tool', t);
		else url.searchParams.delete('tool');
		replaceState(url, {});
	}

	const rows = $derived(tool ? u.rows.filter((r) => r.tool === tool) : u.rows);
	const sessions = $derived(tool ? u.sessions.filter((s) => s.tool === tool) : u.sessions);
	const days = $derived(daysOf(rows, sessions));
	const dayBy = $derived(new Map(days.map((d) => [d.date, d])));
	const all = $derived(sum(rows));

	// What the page counts in: tokens, or what they would have cost at the makers' API prices. The cost is for fun,
	// not a bill (a plan is not paid by the token), and the page says "at API prices" wherever it shows it.
	let measure = $state<'tokens' | 'cost'>('tokens');
	const v = (t: Spent) => (measure === 'cost' ? t.cost : total(t));
	const say = (n: number) => (measure === 'cost' ? money(n) : short(n));
	const sayAll = (n: number) => (measure === 'cost' ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${whole(n)} tokens`);
	const most = <T extends Spent>(ts: T[]) => [...ts].sort((a, b) => v(b) - v(a));

	// What the bars are split by. With every tool in, the tools; with one, its models.
	let chosen = $state<Split | null>(null);
	const split = $derived(chosen ?? (tools.length > 1 && !tool ? 'tool' : 'model'));
	const series = $derived(seriesOf(rows, split));
	const partsOf = (rs: Row[]) => {
		const p = series.map(() => 0);
		for (const r of rs) p[partOf(series, r, split)] += v(r);
		return p;
	};

	// The tiles.
	const since = $derived(isoOf(addDays(today, -29)));
	const month = $derived(days.filter((d) => d.date >= since).reduce((n, d) => n + v(d), 0));
	const busiest = $derived(days.reduce<Day | undefined>((a, d) => (!a || v(d) > v(a) ? d : a), undefined));
	const run = $derived(streaks(days, today));

	// Day by day, as far back as is asked.
	let range = $state(30);
	const trend = $derived(
		Array.from({ length: range }, (_, i) => {
			const date = addDays(today, i - range + 1);
			const d = dayBy.get(isoOf(date));
			return { iso: isoOf(date), date, parts: d ? partsOf(d.rows) : series.map(() => 0), label: dayName(isoOf(date)) };
		})
	);

	// When in the day, by tool: an hour is counted in responses, since that is what the tools say of an hour.
	const toolSeries = $derived(seriesOf(rows, 'tool'));
	const hours = $derived(
		Array.from({ length: 24 }, (_, h) => {
			const p = toolSeries.map(() => 0);
			for (const s of sessions) p[toolSeries.findIndex((t) => t.keys.includes(s.tool))] += s.hours[h] ?? 0;
			return { parts: p, label: hourName(h) };
		})
	);
	const hoursAll = $derived(hours.reduce((n, h) => n + h.parts.reduce((a, b) => a + b, 0), 0));
	const busiestHour = $derived(hours.reduce((a, h, i) => (h.parts.reduce((x, y) => x + y, 0) > hours[a].parts.reduce((x, y) => x + y, 0) ? i : a), 0));

	// The days of the week, Monday first: what was spent on each, over every one of them.
	const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const week = $derived(
		WEEKDAYS.map((name, w) => {
			const on = days.filter((d) => (dateOf(d.date).getDay() + 6) % 7 === w);
			return { name, days: on, parts: partsOf(on.flatMap((d) => d.rows)), label: `${name}s` };
		})
	);

	// The shares.
	const byTool = $derived(
		most(group(rows, 'tool').map((t) => ({ ...t, sessions: sessions.filter((s) => s.tool === t.name).reduce((n, s) => n + s.sessions, 0) })))
	);
	const byMaker = $derived(most(group(rows, 'maker')));
	const byMachine = $derived(
		most(group(rows, 'machine').map((m) => ({ ...m, sessions: sessions.filter((s) => s.machine === m.name).reduce((n, s) => n + s.sessions, 0) })))
	);
	const byModel = $derived(most(group(rows, 'model')));
	// The models with no price known, by name, for the line that says they are left out of the cost.
	const unpriced = $derived(byModel.filter((m) => m.unpriced > 0).map((m) => modelName(m.name)));
	const KINDS = [
		{ key: 'cache_read', name: 'Read from cache' },
		{ key: 'cache_write', name: 'Written to cache' },
		{ key: 'output', name: 'Written out' },
		{ key: 'input', name: 'Read in' }
	] as const;

	// The table at the foot: every day, or every model.
	let table = $state<'day' | 'model'>('day');
	let open = $state<string | null>(null);
	let every = $state(false);
	const listed = $derived([...days].reverse().slice(0, every ? undefined : 14));

	// The hover card: what is under the pointer, and where.
	type Point = ({ kind: 'day'; iso: string } | { kind: 'hour'; i: number } | { kind: 'week'; i: number }) & { at: DOMRect; below?: boolean };
	let point = $state<Point | null>(null);

	// A part of the whole too small to say as a whole number is said to a tenth, and one too small for that as under it.
	const percent = (f: number) => (f >= 0.01 ? `${Math.round(f * 100)}%` : f >= 0.001 ? `${(f * 100).toFixed(1)}%` : f > 0 ? '<0.1%' : '0%');
	function dayName(iso: string, long = false) {
		return dateOf(iso).toLocaleDateString('en-US', long ? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' });
	}
	const fullDay = (iso: string) => dateOf(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	function hourName(h: number) {
		return `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
	}
	const plural = (n: number, one: string, many = `${one}s`) => `${whole(n)} ${n === 1 ? one : many}`;
	function ago(iso: string): string {
		const s = (Date.now() - new Date(iso).getTime()) / 1000;
		if (s < 60) return 'just now';
		if (s < 3600) return `${Math.floor(s / 60)} min ago`;
		if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
		return `${Math.floor(s / 86400)} d ago`;
	}
	const names = (ts: string[]) => (ts.length < 3 ? ts.join(' and ') : `${ts.slice(0, -1).join(', ')} and ${ts.at(-1)}`);
</script>

<svelte:head>
	<title>{u.handle} · tokendash</title>
</svelte:head>

<svelte:window onscroll={() => (point = null)} />

<main class="mx-auto flex max-w-[880px] flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
	<header class="flex items-start justify-between gap-4">
		<div class="flex min-w-0 items-center gap-4">
			<img src="https://github.com/{u.handle}.png?size=128" alt="" class="size-16 shrink-0 rounded-full bg-muted ring-1 ring-foreground/10" />
			<div class="min-w-0">
				<h1 class="truncate text-[22px] font-medium tracking-tight">{u.handle}</h1>
				<p class="text-[13px] text-muted-foreground">
					{names((tool ? [tool] : tools).map(toolName))} since {days.length ? fullDay(days[0].date) : '—'} ·
					<span data-tip={new Date(u.generated_at).toLocaleString('en-US')}>counted {ago(u.generated_at)}</span>
				</p>
			</div>
		</div>
		<AppearanceMenu />
	</header>

	<!-- On a row of their own, always: beside the name the tools went up and down with the length of the line under the
	     name, which changes with the tool chosen, so pressing one moved the page. What is in this row does not change
	     with what is pressed, so where it wraps does not either. -->
	<div class="-mt-2 flex flex-wrap items-center justify-between gap-2">
		{#if tools.length > 1}
			<div class="{SEG} w-fit max-w-full overflow-x-auto [scrollbar-width:none]">
				<button class="{SEG_ITEM} px-2.5 {tool === null ? SEG_ON : SEG_OFF}" onclick={() => only(null)}>All</button>
				{#each tools as t}
					<button class="{SEG_ITEM} flex items-center gap-1.5 px-2.5 {tool === t ? SEG_ON : SEG_OFF}" onclick={() => only(t)}>
						<Mark of={t} class="size-3" />{toolName(t)}
					</button>
				{/each}
			</div>
		{/if}
		<div class="{SEG} ml-auto">
			<button class="{SEG_ITEM} px-2.5 {measure === 'tokens' ? SEG_ON : SEG_OFF}" onclick={() => (measure = 'tokens')}>Tokens</button>
			<button class="{SEG_ITEM} px-2.5 {measure === 'cost' ? SEG_ON : SEG_OFF}" onclick={() => (measure = 'cost')} data-tip="What the tokens would have cost at the makers' API prices">Cost</button>
		</div>
	</div>

	<section class="grid grid-cols-2 sm:grid-cols-4 {CARD} divide-foreground/10 max-sm:[&>*:nth-child(-n+2)]:border-b max-sm:[&>*]:border-foreground/10 sm:divide-x">
		{@render tile(measure === 'cost' ? 'At API prices' : 'Tokens', say(v(all)), measure === 'cost' ? (unpriced.length ? `${short(all.unpriced)} tokens unpriced` : `${money(all.saved)} saved by the cache`) : plural(all.messages, 'response'), sayAll(v(all)))}
		{@render tile('Last 30 days', say(month), `${percent(month / Math.max(v(all), 1e-9))} of it all`, sayAll(month))}
		{@render tile('Busiest day', busiest ? say(v(busiest)) : '0', busiest ? fullDay(busiest.date) : 'None yet', busiest ? sayAll(v(busiest)) : undefined)}
		{@render tile('Days in a row', String(run.now), `${run.longest} at the most`)}
	</section>

	<section class="flex flex-col gap-3">
		<h2 class={HEADING}>The year</h2>
		<div class="{CARD} p-5">
			<Year {days} {today} value={v} hue={(tool && colorOf(tool)) || undefined} onpoint={(iso, at) => (point = iso && at ? { kind: 'day', iso, at, below: true } : null)} />
		</div>
	</section>

	<section class="flex flex-col gap-3">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class={HEADING}>Day by day</h2>
			<!-- One row on a phone too, under the heading and across the page: stacked, the two read as two loose bars. There
			     the range is said as "30 d", as a time is said ("3 h ago"), so both fit down to 360px (under that, it goes under). -->
			<div class="flex flex-wrap gap-2 max-sm:w-full max-sm:justify-between">
				<div class={SEG}>
					{#each SPLITS.filter((s) => s.id !== 'machine' || u.machines.length > 1) as s}
						<button class="{SEG_ITEM} px-1.5 sm:px-2.5 {split === s.id ? SEG_ON : SEG_OFF}" onclick={() => (chosen = s.id)}>{s.name}</button>
					{/each}
				</div>
				<div class={SEG}>
					{#each [30, 90] as n}
						<button class="{SEG_ITEM} px-1.5 sm:px-2.5 {range === n ? SEG_ON : SEG_OFF}" onclick={() => (range = n)} aria-label="{n} days"
							><span class="sm:hidden">{n} d</span><span class="max-sm:hidden">{n} days</span></button
						>
					{/each}
				</div>
			</div>
		</div>
		<div class="{CARD} p-5">
			{#if !trend.some((t) => t.parts.some((p) => p > 0))}
				<p class="text-[13px] text-muted-foreground">Nothing in the last {range} days.</p>
			{:else}
			<Bars
				bars={trend}
				fmt={say}
				colors={series.map((s) => s.color)}
				gap={range > 30 ? 'gap-px' : 'gap-[2px]'}
				ticks={[
					{ at: 0, label: dayName(trend[0].iso) },
					{ at: Math.floor(range / 2), label: dayName(trend[Math.floor(range / 2)].iso) },
					{ at: range - 1, label: 'Today' }
				]}
				onpoint={(i, at) => (point = i !== null && at ? { kind: 'day', iso: trend[i].iso, at } : null)}
			/>
			{@render legend(series.map((s) => ({ name: s.name, color: s.color, key: s.keys.length === 1 ? s.keys[0] : '' })))}
			{/if}
		</div>
	</section>

	<div class="grid gap-6 sm:grid-cols-[3fr_2fr]">
		<section class="flex flex-col gap-3">
			<h2 class={HEADING}>When in the day</h2>
			<div class="{CARD} p-5">
				{#if hoursAll}
					<Bars
						bars={hours}
						colors={toolSeries.map((s) => s.color)}
						height="h-24"
						ticks={[0, 6, 12, 18].map((h) => ({ at: h, label: hourName(h) })).concat([{ at: 23, label: '' }])}
						onpoint={(i, at) => (point = i !== null && at ? { kind: 'hour', i, at } : null)}
					/>
					<p class="mt-3 text-[12px] text-muted-foreground">Busiest from {hourName(busiestHour)} to {hourName((busiestHour + 1) % 24)}</p>
				{:else}
					<p class="text-[13px] text-muted-foreground">Not counted for these days.</p>
				{/if}
			</div>
		</section>
		<section class="flex flex-col gap-3">
			<h2 class={HEADING}>Days of the week</h2>
			<div class="{CARD} p-5">
				<Bars
					bars={week}
					fmt={say}
					colors={series.map((s) => s.color)}
					height="h-24"
					gap="gap-1.5"
					ticks={[{ at: 0, label: 'Mon' }, { at: 3, label: 'Thu' }, { at: 6, label: 'Sun' }]}
					onpoint={(i, at) => (point = i !== null && at ? { kind: 'week', i, at } : null)}
				/>
				<p class="mt-3 text-[12px] text-muted-foreground">Added up over every week</p>
			</div>
		</section>
	</div>

	<div class="grid gap-6 sm:grid-cols-2">
		{#if byTool.length > 1}
			<section class="flex flex-col gap-3">
				<h2 class={HEADING}>By tool</h2>
				<div class={ROWS}>
					{#each byTool as t, i}
						{@render share(toolName(t.name), v(t), v(all), `${plural(t.sessions, 'session')} · ${plural(t.messages, 'response')}`, t.name, fillOf('tool', t.name, 0))}
					{/each}
				</div>
			</section>
		{/if}
		{#if byMaker.length > 1}
			<section class="flex flex-col gap-3">
				<h2 class={HEADING}>By maker</h2>
				<div class={ROWS}>
					{#each byMaker as m, i}
						{@render share(m.name, v(m), v(all), plural(m.messages, 'response'), m.name, fillOf('maker', m.name, i))}
					{/each}
				</div>
			</section>
		{/if}
		{#if byMachine.length > 1}
			<section class="flex flex-col gap-3">
				<h2 class={HEADING}>By machine</h2>
				<div class={ROWS}>
					{#each byMachine as m, i}
						{@render share(m.name, v(m), v(all), `${plural(m.sessions, 'session')} · ${plural(m.messages, 'response')}`, 'machine', fillOf('machine', m.name, i))}
					{/each}
				</div>
			</section>
		{/if}
		<section class="flex flex-col gap-3">
			<h2 class={HEADING}>By model</h2>
			<div class={ROWS}>
				{#each byModel as m}
					{@render share(modelName(m.name), v(m), v(all), `${m.name} · ${plural(m.messages, 'response')}`, makerOf(m.name), fillOf('model', m.name, 0))}
				{/each}
			</div>
		</section>
		<section class="flex flex-col gap-3">
			<h2 class={HEADING}>What the tokens were</h2>
			<div class="{CARD} flex flex-col gap-4 p-5">
				<div class="flex h-2 gap-px overflow-hidden rounded-full">
					{#each KINDS as k, i}
						<div style="flex: {all[k.key]} 0 0; min-width: {all[k.key] ? '2px' : '0'}; background: {SHADES[i]}"></div>
					{/each}
				</div>
				<div class="flex flex-col gap-2 text-[13px]">
					{#each KINDS as k, i}
						<div class="flex items-center gap-2" data-tip="{whole(all[k.key])} tokens">
							<span class="size-2 shrink-0 rounded-[2px]" style="background: {SHADES[i]}"></span>
							<span class="flex-1">{k.name}</span>
							<span class="text-muted-foreground">{short(all[k.key])} · {percent(all[k.key] / Math.max(total(all), 1))}</span>
						</div>
					{/each}
				</div>
				{#if all.saved > 0}
					<!-- What reading from the cache came to against reading the same tokens in fresh, at API prices. -->
					<div class="flex items-center justify-between border-t border-border/50 pt-3 text-[13px]" data-tip="Read from the cache, against reading the same in fresh, at API prices">
						<span>Saved by the cache</span>
						<span class="text-muted-foreground">{money(all.saved)}</span>
					</div>
				{/if}
			</div>
		</section>
	</div>

	<section class="flex flex-col gap-3">
		<div class="flex items-center justify-between gap-2">
			<h2 class={HEADING}>{table === 'day' ? 'Every day' : 'Every model'}</h2>
			<div class={SEG}>
				<button class="{SEG_ITEM} px-2.5 {table === 'day' ? SEG_ON : SEG_OFF}" onclick={() => (table = 'day')}>Day</button>
				<button class="{SEG_ITEM} px-2.5 {table === 'model' ? SEG_ON : SEG_OFF}" onclick={() => (table = 'model')}>Model</button>
			</div>
		</div>
		<div class="{CARD} overflow-x-auto">
			<table class="w-full text-[13px] sm:min-w-[640px]">
				<thead>
					<tr class="border-b border-border/50 text-left text-[12px] text-muted-foreground [&>th]:px-3 [&>th]:py-2.5 [&>th]:font-normal [&>th:first-child]:pl-5 [&>th:last-child]:pr-5">
						<th>{table === 'day' ? 'Day' : 'Model'}</th>
						{#if table === 'model'}<th class="max-sm:hidden">Tools</th>{/if}
						<th class="text-right">Tokens</th>
						<th class="text-right max-sm:hidden" data-tip="At API prices, as of {fullDay(PRICED.as_of.slice(0, 10))}">Cost</th>
						{#if table === 'model'}<th class="text-right max-sm:pr-5">Share</th>{/if}
						<th class="text-right max-sm:hidden">From cache</th>
						<th class="text-right max-sm:hidden">To cache</th>
						<th class="text-right max-sm:hidden">Out</th>
						<th class="text-right max-sm:hidden">In</th>
						<th class="text-right {table === 'model' ? 'max-sm:hidden' : 'max-sm:pr-5'}">Responses</th>
						{#if table === 'day'}<th class="text-right max-sm:hidden">Sessions</th>{/if}
					</tr>
				</thead>
				<tbody class="divide-y divide-border/50">
					{#if table === 'day'}
						{#each listed as d (d.date)}
							<tr
								class="cursor-pointer transition-colors hover:bg-foreground/[0.03] [&>td]:px-3 [&>td]:py-2.5 [&>td:first-child]:pl-5 [&>td:last-child]:pr-5"
								onclick={() => (open = open === d.date ? null : d.date)}
								aria-expanded={open === d.date}
							>
								<td class="whitespace-nowrap">
									<span class="mr-1.5 inline-block text-muted-foreground transition-transform {open === d.date ? 'rotate-90' : ''}">›</span><span class="sm:hidden">{dayName(d.date, true).replace(/, \d{4}$/, '')}</span><span class="max-sm:hidden">{dayName(d.date, true)}</span>
								</td>
								{@render cells(d, false)}
								<td class="text-right text-muted-foreground max-sm:hidden">{whole(d.sessions)}</td>
							</tr>
							{#if open === d.date}
								<!-- On a phone the kinds of token and the sessions have no columns: the day says them when it is opened. -->
								<tr class="bg-foreground/[0.02] text-[12px] text-muted-foreground sm:hidden">
									<td colspan="3" class="px-5 pt-2.5 pb-1">
										<div class="grid grid-cols-2 gap-x-6 gap-y-0.5 pl-4">
											{#each [['From cache', short(d.cache_read)], ['To cache', short(d.cache_write)], ['Out', short(d.output)], ['In', short(d.input)], ['Sessions', whole(d.sessions)], ['Cost', d.unpriced && !d.cost ? '—' : money(d.cost)]] as const as [name, n]}
												<div class="flex justify-between gap-3"><span>{name}</span><span class="text-foreground">{n}</span></div>
											{/each}
										</div>
									</td>
								</tr>
								{#each group(d.rows, 'model').flatMap((m) => group(d.rows.filter((r) => r.model === m.name), 'tool').map((t) => ({ ...t, model: m.name }))) as m}
									<tr class="bg-foreground/[0.02] text-muted-foreground [&>td]:px-3 [&>td]:py-2 [&>td:first-child]:pl-5 [&>td:last-child]:pr-5">
										<td class="whitespace-nowrap pl-9!">
											<span class="flex items-center gap-1.5"><Mark of={m.name} class="size-3" />{modelName(m.model)}</span>
										</td>
										{@render cells(m, true)}
										<td class="max-sm:hidden"></td>
									</tr>
								{/each}
							{/if}
						{/each}
					{:else}
						{#each byModel as m}
							<tr class="[&>td]:px-3 [&>td]:py-2.5 [&>td:first-child]:pl-5 [&>td:last-child]:pr-5">
								<td class="whitespace-nowrap" data-tip={m.name}>
									<span class="flex items-center gap-2"><span class="text-muted-foreground"><Mark of={makerOf(m.name)} class="size-3.5" /></span>{modelName(m.name)}</span>
								</td>
								<td class="whitespace-nowrap text-muted-foreground max-sm:hidden">{names(group(rows.filter((r) => r.model === m.name), 'tool').map((t) => toolName(t.name)))}</td>
								<td class="text-right" data-tip={whole(total(m))}>{short(total(m))}</td>
								<td class="text-right max-sm:hidden" data-tip={m.unpriced ? 'No price known' : undefined}>{m.unpriced ? '—' : money(m.cost)}</td>
								<td class="text-right text-muted-foreground max-sm:pr-5">{percent(v(m) / Math.max(v(all), 1e-9))}</td>
								{@render cells(m, true, true)}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
			{#if table === 'day' && days.length > 14}
				<div class="border-t border-border/50 px-3 py-2">
					<button class={BTN} onclick={() => (every = !every)}>{every ? 'Show the last 14' : `Show all ${days.length} days`}</button>
				</div>
			{/if}
		</div>
	</section>

	<!-- Where the prices are from, and what the cost leaves out: said once, at the foot, and not over every number. -->
	<footer class="text-[12px] leading-relaxed text-muted-foreground">
		Cost is what the tokens would have cost at the makers' API prices, from
		<a href={PRICED.source} class="underline decoration-foreground/20 underline-offset-2 hover:decoration-foreground/50">LiteLLM's list</a>
		as of {fullDay(PRICED.as_of.slice(0, 10))}, every cache write at the five-minute rate. A plan is not paid by the token, so it is not what was paid.
		{#if unpriced.length}{names(unpriced)} {unpriced.length === 1 ? 'has' : 'have'} no price and {unpriced.length === 1 ? 'is' : 'are'} left out of it.{/if}
	</footer>
</main>

<Hover at={point?.at ?? null} below={point?.below}>
	{#if point?.kind === 'day'}
		{@const d = dayBy.get(point.iso)}
		{#if d}
			<Breakdown
				title={dayName(point.iso, true)}
				value={say(v(d))}
				fmt={say}
				parts={group(d.rows, split).map((p) => ({ name: nameOf(split, p.name), n: v(p), color: series[partOf(series, d.rows.find((r) => r[split] === p.name)!, split)].color }))}
				kinds={d}
				foot={[`${plural(d.messages, 'response')} · ${plural(d.sessions, 'session')}`, measure === 'cost' ? `${short(total(d))} tokens` : d.unpriced && !d.cost ? 'No price known' : `${money(d.cost)} at API prices`]}
			/>
		{:else}
			<Breakdown title={dayName(point.iso, true)} value="Nothing" />
		{/if}
	{:else if point?.kind === 'hour'}
		{@const h = hours[point.i]}
		{@const n = h.parts.reduce((a, b) => a + b, 0)}
		<Breakdown
			title="{hourName(point.i)} to {hourName((point.i + 1) % 24)}"
			value={plural(n, 'response')}
			parts={toolSeries.map((s, j) => ({ name: s.name, n: h.parts[j], color: s.color })).filter((p) => p.n > 0)}
			foot={[`${percent(n / Math.max(hoursAll, 1))} of every response`]}
		/>
	{:else if point?.kind === 'week'}
		{@const w = week[point.i]}
		{@const n = w.parts.reduce((a, b) => a + b, 0)}
		<Breakdown
			title={w.label}
			value={say(n)}
			fmt={say}
			parts={series.map((s, j) => ({ name: s.name, n: w.parts[j], color: s.color })).filter((p) => p.n > 0)}
			foot={[`${plural(w.days.length, 'day')} with any · ${say(n / Math.max(w.days.length, 1))} on each`]}
		/>
	{/if}
</Hover>

{#snippet tile(name: string, value: string, note: string, exact?: string)}
	<div class="flex flex-col gap-1 p-5">
		<div class="text-[12px] text-muted-foreground">{name}</div>
		<div class="text-[28px] font-medium tracking-tight" data-tip={exact}>{value}</div>
		<div class="truncate text-[12px] text-muted-foreground">{note}</div>
	</div>
{/snippet}

<!-- Under a chart, what each of its steps is. -->
{#snippet legend(items: { name: string; color: string; key: string }[])}
	{#if items.length > 1}
		<div class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground">
			{#each items as it}
				<span class="flex items-center gap-1.5"><span class="size-2 rounded-[2px]" style="background: {it.color}"></span>{it.name}</span>
			{/each}
		</div>
	{/if}
{/snippet}

<!-- A row: its mark, what it is, how much, and a bar under it for its part of the whole. -->
{#snippet share(name: string, n: number, of: number, tip: string, mark: string, color: string)}
	<div class="flex flex-col gap-2 px-4 py-3" data-tip={tip}>
		<div class="flex items-baseline justify-between gap-3 text-[14px]">
			<span class="flex min-w-0 items-center gap-2 self-center"><span class="text-muted-foreground"><Mark of={mark} /></span><span class="truncate">{name}</span></span>
			<span class="shrink-0 text-[13px] text-muted-foreground">{say(n)} · {percent(n / Math.max(of, 1e-9))}</span>
		</div>
		<div class="h-1 overflow-hidden rounded-full bg-foreground/[0.07]">
			<div class="h-full rounded-full" style="background: {color}; width: {Math.max(0.5, (n / Math.max(of, 1)) * 100)}%"></div>
		</div>
	</div>
{/snippet}

<!-- A table row's counts, each short with the whole of it under the pointer. A day's own total comes first; a model's is said before its share.
     On a phone only the total and the responses are columns, and a model's responses go too, for its share. -->
{#snippet cells(t: Spent, quiet: boolean, skipTotal = false)}
	{#if !skipTotal}
		<td class="text-right {quiet ? '' : 'font-medium'}" data-tip={whole(total(t))}>{short(total(t))}</td>
		<td class="text-right text-muted-foreground max-sm:hidden" data-tip={t.unpriced ? (t.cost ? `${short(t.unpriced)} tokens with no price known` : 'No price known') : undefined}>{t.unpriced && !t.cost ? '—' : money(t.cost)}</td>
	{/if}
	<td class="text-right text-muted-foreground max-sm:hidden" data-tip={whole(t.cache_read)}>{short(t.cache_read)}</td>
	<td class="text-right text-muted-foreground max-sm:hidden" data-tip={whole(t.cache_write)}>{short(t.cache_write)}</td>
	<td class="text-right text-muted-foreground max-sm:hidden" data-tip={whole(t.output)}>{short(t.output)}</td>
	<td class="text-right text-muted-foreground max-sm:hidden" data-tip={whole(t.input)}>{short(t.input)}</td>
	<td class="text-right text-muted-foreground {skipTotal ? 'max-sm:hidden' : 'max-sm:pr-5'}">{whole(t.messages)}</td>
{/snippet}
