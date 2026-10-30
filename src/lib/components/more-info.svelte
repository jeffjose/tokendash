<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { Icon } from '#lib/icon.js';

	/**
	 * More about something, for whoever wants it: a small (i) beside the
	 * thing, which opens what there is to say. So that the page itself can
	 * say a few words and no more.
	 */
	let { children, label = 'More about this' }: { children: Snippet; label?: string } = $props();
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button {...props} aria-label={label} class="inline-grid size-5 shrink-0 place-items-center rounded-full align-[-4px] text-muted-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground data-[state=open]:bg-foreground/10 data-[state=open]:text-foreground">
				<Icon name="info" class="size-3.5" />
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content side="top" align="start" class="w-72 text-[13px] leading-snug text-muted-foreground">{@render children()}</Popover.Content>
</Popover.Root>
