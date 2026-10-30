<script lang="ts">
	import { short, type Tokens } from '#lib/usage.js';

	/** Inside the hover card: what it is, how much, its parts each with its share, what kind of tokens, and a line about it. */
	let {
		title,
		value,
		parts = [],
		kinds,
		foot = []
	}: { title: string; value: string; parts?: { name: string; n: number; color: string }[]; kinds?: Tokens; foot?: string[] } = $props();

	const of = $derived(parts.reduce((n, p) => n + p.n, 0));
	const percent = (f: number) => (f >= 0.01 ? `${Math.round(f * 100)}%` : f > 0 ? '<1%' : '0%');
	// The card's words are on a dark ground in every look: quiet ones are a gray of that ground, not the page's.
	const QUIET = 'color: oklch(0.72 0.006 286)';
	const RULE = 'mt-2 border-t border-white/10 pt-2';
</script>

<div class="flex items-baseline justify-between gap-6">
	<span style={QUIET}>{title}</span>
	<span class="text-[13.5px] font-medium">{value}</span>
</div>
{#if parts.length}
	<div class="mt-2 flex flex-col gap-1">
		{#each parts as p}
			<div class="flex items-center gap-2">
				<span class="size-2 shrink-0 rounded-[2px]" style="background: {p.color}"></span>
				<span class="min-w-0 flex-1 truncate">{p.name}</span>
				<span class="pl-3">{short(p.n)}</span>
				{#if parts.length > 1}<span class="w-9 text-right" style={QUIET}>{percent(p.n / Math.max(of, 1))}</span>{/if}
			</div>
		{/each}
	</div>
{/if}
{#if kinds}
	<div class="{RULE} grid grid-cols-2 gap-x-5 gap-y-0.5">
		{#each [['From cache', kinds.cache_read], ['To cache', kinds.cache_write], ['Out', kinds.output], ['In', kinds.input]] as const as [name, n]}
			<div class="flex justify-between gap-3"><span style={QUIET}>{name}</span><span>{short(n)}</span></div>
		{/each}
	</div>
{/if}
{#each foot as line, i}
	<div class={i === 0 ? RULE : 'mt-0.5'} style={QUIET}>{line}</div>
{/each}
