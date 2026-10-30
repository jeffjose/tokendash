<script lang="ts">
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { Icon } from '#lib/icon.js';
	import type { Entry } from '#lib/menus.js';
	import MenuList from './menu-list.svelte';

	/** The same list as the menu under the right button (`right-click.svelte`), for inside a menu that drops from a button. */
	let { items }: { items: Entry[] } = $props();
</script>

{#each items as e, n (n)}
	{#if e === 'line'}
		<DropdownMenu.Separator />
	{:else if e.sub}
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger class="gap-2 text-[13px]">{#if e.icon}<Icon name={e.icon} class="size-4 opacity-70" />{/if}{e.label}</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent class="max-h-80 w-56"><MenuList items={e.sub} /></DropdownMenu.SubContent>
		</DropdownMenu.Sub>
	{:else if e.chips}
		<div class="flex items-center gap-0.5">
			<DropdownMenu.Item class="min-w-0 flex-1 gap-2 text-[13px]" disabled={e.disabled} onSelect={() => void e.run?.()}>
				<span class="grid size-4 place-items-center">{#if e.icon}<Icon name={e.icon} class="size-4 opacity-70" />{/if}</span><span class="min-w-0 flex-1 truncate">{e.label}</span>
			</DropdownMenu.Item>
			{#each e.chips as c (c.label)}
				<DropdownMenu.Item class="grid h-6 min-w-7 shrink-0 place-items-center px-1 text-[11.5px] font-medium text-muted-foreground" disabled={c.disabled} data-tip={c.tip} onSelect={() => void c.run()}>{c.label}</DropdownMenu.Item>
			{/each}
		</div>
	{:else}
		<DropdownMenu.Item class="gap-2 text-[13px] {e.danger ? 'text-[var(--fail-11)]' : ''}" disabled={e.disabled} onSelect={() => void e.run?.()}>
			<span class="grid size-4 place-items-center">{#if e.dot}<span class="size-3 rounded-full" style="background: {e.dot}"></span>{:else if e.icon}<Icon name={e.icon} class="size-4 opacity-70" />{/if}</span><span class="min-w-0 flex-1 truncate">{e.label}</span>{#if e.checked}<Icon name="check" class="size-3.5 opacity-70" />{/if}
		</DropdownMenu.Item>
	{/if}
{/each}
