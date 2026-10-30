<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Icon } from '#lib/icon.js';
	import MoreInfo from '#lib/components/more-info.svelte';
	import type { IconName } from '#lib/icons.js';

	/**
	 * One setting: what it is called and, under that, what it does, with the
	 * control for it at the right. Every section of Settings is a list of
	 * these, a hairline between each, so the eye runs down the names on the
	 * left and across to the one it wants.
	 *
	 * `below` is for what does not fit beside a name: a picture of the choice,
	 * a list. It takes the full width under the row.
	 */
	let {
		title,
		icon,
		description,
		info,
		children,
		below,
		details
	}: {
		title: string;
		/** A picture of what the row is about, before its name: for rows that are things (a server) and not settings. */
		icon?: IconName;
		description?: string;
		/** More about it, for whoever wants it: behind an (i) beside its name, so that the row itself says only a few words. */
		info?: string;
		/** In place of `description`, when it is more than a sentence of text. */
		details?: Snippet;
		/** The control, at the right. */
		children?: Snippet;
		below?: Snippet;
	} = $props();
</script>

<div class="border-b border-border/60 py-4 last:border-b-0">
	<div class="flex flex-wrap items-center gap-x-8 gap-y-3">
		<div class="flex min-w-[14rem] flex-1 items-start gap-3">
			{#if icon}
				<span class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-foreground/[0.06] text-muted-foreground"><Icon name={icon} class="size-4" /></span>
			{/if}
			<div class="min-w-0 flex-1">
				<div class="text-[14px]">{title}{#if info}<span class="ml-1.5"><MoreInfo label="More about {title}">{info}</MoreInfo></span>{/if}</div>
				{#if details}
					<div class="mt-0.5 text-[13px] leading-snug text-muted-foreground">{@render details()}</div>
				{:else if description}
					<p class="mt-0.5 text-[13px] leading-snug text-muted-foreground">{description}</p>
				{/if}
			</div>
		</div>
		{#if children}
			<div class="flex shrink-0 items-center gap-2">{@render children()}</div>
		{/if}
	</div>
	{#if below}
		<div class="mt-4">{@render below()}</div>
	{/if}
</div>
