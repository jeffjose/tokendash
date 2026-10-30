<script lang="ts">
	import { ContextMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { Icon } from '#lib/icon.js';
	import type { Entry } from '#lib/menus.js';

	/**
	 * A menu under the right button, on whatever is given: what can be done to
	 * that thing, where it is. The list is made when the menu is asked for
	 * (`items` is a function), so that it says how things stand then.
	 *
	 * Whatever is here is also reached by something that can be seen (the
	 * thing itself, or a "···" beside it that drops the same list,
	 * `menu-list.svelte`): not everyone thinks to press the right button.
	 */
	let { items, children }: { items: () => Entry[]; children: Snippet<[Record<string, unknown>]> } = $props();
	let open = $state(false);

	const CONTENT = 'pop z-50 min-w-48 max-w-80 overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-lg outline-none ring-1 ring-foreground/10';
	const ITEM = 'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-45';
</script>

{#snippet list(entries: Entry[])}
	{#each entries as e, n (n)}
		{#if e === 'line'}
			<ContextMenu.Separator class="-mx-1 my-1 h-px bg-border" />
		{:else if e.sub}
			<ContextMenu.Sub>
				<ContextMenu.SubTrigger class={ITEM}>
					{#if e.icon}<Icon name={e.icon} class="size-4 opacity-70" />{/if}<span class="flex-1">{e.label}</span><Icon name="chevron-right" class="size-3.5 opacity-60" />
				</ContextMenu.SubTrigger>
				<ContextMenu.SubContent class="{CONTENT} max-h-80" sideOffset={6}>{@render list(e.sub)}</ContextMenu.SubContent>
			</ContextMenu.Sub>
		{:else if e.chips}
			<!-- The thing itself, and at its right the other ways of doing it, each a thing of the menu in its own right: one press does any of them. -->
			<div class="flex items-center gap-0.5">
				<ContextMenu.Item class="{ITEM} min-w-0 flex-1" disabled={e.disabled} onSelect={() => void e.run?.()}>
					<span class="grid size-4 place-items-center">{#if e.icon}<Icon name={e.icon} class="size-4 opacity-70" />{/if}</span><span class="min-w-0 flex-1 truncate">{e.label}</span>
				</ContextMenu.Item>
				{#each e.chips as c (c.label)}
					<ContextMenu.Item class="grid h-6 min-w-7 shrink-0 cursor-pointer select-none place-items-center rounded-md px-1 text-[11.5px] font-medium text-muted-foreground outline-none data-[highlighted]:bg-accent data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-35" disabled={c.disabled} data-tip={c.tip} onSelect={() => void c.run()}>{c.label}</ContextMenu.Item>
				{/each}
			</div>
		{:else}
			<ContextMenu.Item class="{ITEM} {e.danger ? 'text-[var(--fail-11)]' : ''}" disabled={e.disabled} onSelect={() => void e.run?.()}>
				<span class="grid size-4 place-items-center">{#if e.dot}<span class="size-3 rounded-full" style="background: {e.dot}"></span>{:else if e.icon}<Icon name={e.icon} class="size-4 opacity-70" />{/if}</span><span class="min-w-0 flex-1 truncate">{e.label}</span>{#if e.checked}<Icon name="check" class="size-3.5 opacity-70" />{/if}
			</ContextMenu.Item>
		{/if}
	{/each}
{/snippet}

<ContextMenu.Root bind:open>
	<ContextMenu.Trigger>
		{#snippet child({ props })}{@render children(props)}{/snippet}
	</ContextMenu.Trigger>
	<ContextMenu.Portal>
		<ContextMenu.Content class="{CONTENT} max-h-[70svh]">
			{#if open}{@render list(items())}{/if}
		</ContextMenu.Content>
	</ContextMenu.Portal>
</ContextMenu.Root>
