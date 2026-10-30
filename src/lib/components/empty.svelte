<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Icon, type IconName } from '#lib/icon.js';

	/**
	 * Somewhere with nothing in it, said the one way everywhere: an icon, and
	 * under it a few words, in the middle. What can be done about it, if
	 * anything, goes under the words.
	 */
	let { icon, children, class: className = 'py-16' }: { icon: IconName; children: Snippet; class?: string } = $props();
</script>

<div class="flex flex-col items-center gap-3 text-center {className}">
	<span class="grid size-12 place-items-center rounded-2xl bg-foreground/[0.05] text-muted-foreground">
		<Icon name={icon} class="size-[22px]" />
	</span>
	<p class="max-w-sm text-[14px] leading-relaxed text-muted-foreground">{@render children()}</p>
</div>
