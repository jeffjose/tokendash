<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A run of settings that go together, under their name. A section of
	 * Settings is one or more of these, well apart from each other.
	 */
	let {
		title,
		aside,
		children
	}: {
		title: string;
		/** Beside the name, at the right: something to do to the whole group. */
		aside?: Snippet;
		children: Snippet;
	} = $props();
</script>

<section class="mt-10 first:mt-0">
	<div class="flex min-h-8 items-center gap-3">
		<h2 class="min-w-0 flex-1 text-[15px] font-medium tracking-tight">{title}</h2>
		{@render aside?.()}
	</div>
	<div class="mt-1">{@render children()}</div>
</section>
