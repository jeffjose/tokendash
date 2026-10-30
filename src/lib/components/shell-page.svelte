<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import Pane from '#lib/components/pane.svelte';
	import Empty from '#lib/components/empty.svelte';
	import { Icon, type IconName } from '#lib/icon.js';
	import { ui } from '#lib/ui.svelte.js';
	import { TITLE } from '#lib/styles.js';

	/**
	 * A page of the app as the shell has it: the middle under a header bar
	 * that names it, and the pane on the right under a bar of its own, as tall
	 * as the first so the two read as one. Neither has anything in it yet:
	 * what is given as `children` and `side` goes in them, and with nothing
	 * given each says that it is empty.
	 */
	let {
		title,
		icon,
		empty,
		sideTitle = 'Details',
		sideEmpty = 'Nothing selected.',
		children,
		side
	}: {
		title: string;
		icon: IconName;
		/** What the middle says while there is nothing in it. */
		empty: string;
		sideTitle?: string;
		sideEmpty?: string;
		children?: Snippet;
		side?: Snippet;
	} = $props();

	const sidebar = Sidebar.useSidebar();

	const HEAD_BTN =
		'-ml-1.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40';
	const corner = 'grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground';
</script>

<svelte:head><title>{title} · Title</title></svelte:head>

<Pane>
	{#snippet main()}
		<header class="flex h-12 shrink-0 items-center gap-2.5 border-b border-border/70 pl-5 pr-3">
			<!-- With the sidebar folded, the window's fold button is in this corner: leave it room. -->
			{#if !sidebar.open}<span class="w-7 shrink-0 max-md:hidden"></span>{/if}
			<Icon name={icon} class="size-[18px] shrink-0 text-muted-foreground/70" />
			<h1 class="min-w-0 flex-1 {TITLE}">{title}</h1>
			<!-- The pane on the right: opened from here, lit while it is open, and closed from its own corner too. -->
			<button
				onclick={() => (ui.inspector = !ui.inspector)}
				data-tip={ui.inspector ? 'Hide the right panel (⌘I)' : 'Show the right panel (⌘I)'}
				aria-label={sideTitle}
				aria-pressed={ui.inspector}
				class="{HEAD_BTN} max-md:hidden {ui.inspector ? 'bg-accent text-foreground' : ''}"
			>
				<Icon name="panel-right" class="size-[15px]" />
			</button>
		</header>
		<div class="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]">
			{#if children}
				{@render children()}
			{:else}
				<Empty {icon} class="pt-20">{empty}</Empty>
			{/if}
		</div>
	{/snippet}
	{#snippet inspector()}
		<!-- As tall as the header beside it, so the two read as one bar. -->
		<div class="flex h-12 shrink-0 items-center gap-0.5 border-b border-border/70 pl-4 pr-1.5">
			<h2 class="min-w-0 flex-1 truncate text-[14px] font-medium">{sideTitle}</h2>
			<!-- In its corner: room to work in (the whole middle), and the way out. -->
			<button
				onclick={() => (ui.inspectorWide = !ui.inspectorWide)}
				aria-label={ui.inspectorWide ? 'Collapse' : 'Expand'}
				data-tip={ui.inspectorWide ? 'Collapse' : 'Expand'}
				class="{corner} max-md:hidden"
			>
				<Icon name={ui.inspectorWide ? 'minimize' : 'maximize'} class="size-4" />
			</button>
			<button onclick={() => (ui.inspector = false)} aria-label="Close" data-tip="Close (⌘I)" class={corner}>
				<Icon name="x" class="size-4" />
			</button>
		</div>
		<div class="min-h-0 flex-1 overflow-y-auto p-3 {ui.inspectorWide ? '[&>*]:mx-auto [&>*]:max-w-3xl md:p-8' : ''}">
			{#if side}
				{@render side()}
			{:else}
				<Empty icon="file" class="pt-20">{sideEmpty}</Empty>
			{/if}
		</div>
	{/snippet}
</Pane>
