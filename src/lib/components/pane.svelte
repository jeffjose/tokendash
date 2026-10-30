<script lang="ts">
	import Inspector from '#lib/components/inspector.svelte';
	import { ui } from '#lib/ui.svelte.js';
	import type { Snippet } from 'svelte';

	/**
	 * Middle + right, which is every page in this app. The left rail is the
	 * layout's; a page owns the other two and nothing else, so the shell can
	 * never disagree with itself about how wide the middle is.
	 */
	let { main, inspector }: { main: Snippet; inspector?: Snippet } = $props();
	/** The right pane has the whole middle to itself (on a screen wide enough to have a right pane at all). */
	const taken = $derived(!!inspector && ui.inspector && ui.inspectorWide);
</script>

<!-- `flex-1 min-h-0`, never `h-full`: a full-height child of a column flex
     measures against the whole inset and overflows whatever is beside or
     above it. -->
<div class="flex min-h-0 flex-1">
	<main class="flex min-w-0 flex-1 flex-col overflow-hidden {taken ? 'md:hidden' : ''}">
		{@render main()}
	</main>
	{#if inspector}
		<Inspector bind:open={ui.inspector} body={inspector} />
	{/if}
</div>
