<script lang="ts">
	import Icon from '#lib/components/icon.svelte';
	import { MARKS } from '#lib/marks.js';

	/**
	 * A tool's or a maker's mark, in the color of the words beside it; a machine's is the interface's own monitor.
	 * One with no mark is a small dot, so a column of them still lines up.
	 */
	let { of, class: cls = 'size-3.5' }: { of: string; class?: string } = $props();
</script>

{#if MARKS[of]}
	<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="shrink-0 {cls}"><path d={MARKS[of]} /></svg>
{:else if of === 'machine'}
	<Icon name="monitor" class={cls} />
{:else}
	<span aria-hidden="true" class="grid shrink-0 place-items-center {cls}"><span class="size-1.5 rounded-full bg-current opacity-60"></span></span>
{/if}
