<script lang="ts">
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { Icon } from '#lib/icon.js';
	import type { Snippet } from 'svelte';

	/**
	 * The explanation of something, behind an (i).
	 *
	 * A sentence of help under every heading is a page of sentences, read once
	 * and then stepped over for ever. The heading is enough when you know; the
	 * (i) is there when you do not.
	 */
	let {
		children,
		label = 'What is this?',
		class: className = ''
	}: { children: Snippet; label?: string; class?: string } = $props();
</script>

<Popover.Root>
	<Popover.Trigger
		aria-label={label}
		class="inline-grid size-[18px] shrink-0 place-items-center rounded-full align-[-3px] text-muted-foreground/60 outline-none transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/30 data-[state=open]:bg-foreground/10 data-[state=open]:text-foreground {className}"
	>
		<Icon name="info" class="size-3.5" />
	</Popover.Trigger>
	<Popover.Content
		side="top"
		align="start"
		sideOffset={6}
		class="w-72 rounded-xl border-0 p-3 text-[13px] font-normal normal-case leading-relaxed tracking-normal text-foreground/90 shadow-2xl ring-1 ring-foreground/10"
	>
		<!-- One run of text: the popover lays its children out in a column, which put every word set as code on a line of its own.
		     Something to type is set off by a faint box, in the words' own face. -->
		<div class="[&_code]:whitespace-nowrap [&_code]:rounded [&_code]:bg-foreground/[0.08] [&_code]:px-1 [&_code]:py-px [&_code]:text-[12px]">{@render children()}</div>
	</Popover.Content>
</Popover.Root>
