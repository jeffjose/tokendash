<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import SidebarShell from '#lib/components/sidebar-shell.svelte';
	import { Icon } from '#lib/icon.js';
	import { mergeProps } from 'bits-ui';
	import RightClick from '#lib/components/right-click.svelte';
	import { ACTION, PLACES, isAt } from '#lib/nav.js';
	import { placeMenu } from '#lib/menus.js';
	import { ui } from '#lib/ui.svelte.js';
</script>

<SidebarShell>
	{#snippet body({ inPeek, dismiss })}
		<!-- The corner is left for the fold button, which is the window's and
		     not the sidebar's (`sidebar-toggle`): it stays where it is whether
		     the sidebar is open or folded. -->
		<div class="flex h-12 shrink-0 items-center gap-1.5 px-2.5">
			{#if !inPeek}<span class="size-8 shrink-0"></span>{/if}
			<!-- The name is the logo: plain, in the app's own face. -->
			<a href="/" onclick={dismiss} class="px-1 text-[15px] font-medium leading-none tracking-tight">Title</a>
		</div>

		<!-- Looks like a box to type in; it opens the search over everything. -->
		<div class="shrink-0 px-2 pb-2">
			<button
				onclick={() => (dismiss(), (ui.palette = true))}
				class="flex h-9 w-full items-center gap-2.5 rounded-lg border border-border bg-background/40 px-2.5 text-[14px] text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
			>
				<Icon name="search" class="size-4 shrink-0" />
				<span class="flex-1 text-left">Search</span>
				<kbd class="rounded bg-foreground/[0.07] px-1.5 py-px font-sans text-[11px]">⌘K</kbd>
			</button>
		</div>

		<!-- The one thing to make is a place like the others below, and it is
		     lit while you are there, however you got there. Then the places. -->
		<div class="shrink-0 px-2 pb-2">
			<Sidebar.Menu>
				{#each [ACTION, ...PLACES] as item (item.href)}
					<Sidebar.MenuItem>
						<!-- What can be done to a place is under the right button on it (`menus.ts`). -->
						<RightClick items={() => placeMenu(item)}>
							{#snippet children(menu)}
								<Sidebar.MenuButton isActive={isAt(item, page.url.pathname)}>
									{#snippet child({ props })}
										<a href={item.href} {...mergeProps(props, menu)} onclick={dismiss}>
											<Icon name={item.icon} class="shrink-0" />
											<span class="flex-1 font-medium">{item.label}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							{/snippet}
						</RightClick>
					</Sidebar.MenuItem>
				{/each}
			</Sidebar.Menu>
		</div>

		<!-- Where what there is a list of will go (labels, folders, accounts): it
		     takes the room that is left, and scrolls by itself. -->
		<div class="min-h-0 flex-1 overflow-y-auto px-2 pb-2"></div>

		<!-- Settings alone at the foot: it is about the app, not a place in it,
		     and it opens over wherever you are. -->
		<div class="flex shrink-0 items-center gap-1 border-t border-border p-2">
			<Sidebar.Menu class="min-w-0 flex-1">
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={ui.settings !== null}>
						{#snippet child({ props })}
							<button {...props} onclick={() => (dismiss(), (ui.settings = 'appearance'))}>
								<Icon name="sliders-horizontal" class="shrink-0" />
								<span class="flex-1 text-left font-medium">Settings</span>
							</button>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</div>
	{/snippet}
</SidebarShell>
