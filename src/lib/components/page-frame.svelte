<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ASIDE } from '#lib/styles.js';

	/**
	 * A page that is not a conversation. There is no bar across the top: the
	 * page's name stands at the head of its column with room round it, and
	 * under it one line for moving about the page (its tabs, at the left) and
	 * for what can be done on it (at the right). Everything scrolls together.
	 */
	let {
		title,
		aside,
		lead,
		after,
		tabs,
		actions,
		children,
		width = 'max-w-3xl'
	}: {
		title: string;
		/** Beside the title: a count, or where this is. */
		aside?: string | number;
		/** Before the title: a color, an icon. */
		lead?: Snippet;
		/** Straight after the title: an (i). */
		after?: Snippet;
		/** The parts of the page, under the title at the left. */
		tabs?: Snippet;
		/** What can be done here, under the title at the right. */
		actions?: Snippet;
		children: Snippet;
		/** How wide the column may get; `max-w-none` fills the page. */
		width?: string;
	} = $props();
</script>

<div class="relative min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
	<div class="mx-auto px-8 pb-12 pt-14 {width}">
		<!-- The name, and across from it what can be done on the page. -->
		<div class="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-2">
			{@render lead?.()}
			<h1 class="page-title min-w-0 truncate">{title}</h1>
			{#if aside !== undefined && aside !== ''}
				<span class="mt-2 shrink-0 {ASIDE}">{aside}</span>
			{/if}
			{@render after?.()}
			<div class="flex-1"></div>
			<div class="flex items-center gap-1.5">{@render actions?.()}</div>
		</div>
		<!-- Under it, the parts of the page, when it has parts. -->
		{#if tabs}
			<div class="mt-5 flex flex-wrap items-center gap-1">{@render tabs()}</div>
		{/if}
		<div class="mt-6">
			{@render children()}
		</div>
	</div>
</div>

<style>
	/* A page's name, set as Home's greeting is: it is the one large thing on the page. */
	.page-title {
		font-weight: 500;
		font-size: 26px;
		line-height: 1.15;
		letter-spacing: -0.01em;
	}
</style>
