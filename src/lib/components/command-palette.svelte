<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Command from '#lib/components/ui/command/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { Icon } from '#lib/icon.js';
	import type { IconName } from '#lib/icons.js';
	import { ACTION, PLACES } from '#lib/nav.js';
	import { ui, appearance, SETTINGS_SECTIONS, MODES, LOOKS } from '#lib/ui.svelte.js';

	/**
	 * Going anywhere, from anywhere: ⌘K (or the search box in the sidebar),
	 * a few letters, Enter. It finds the places there are and the things
	 * there are to do.
	 *
	 * It is inside the sidebar's provider (`+layout.svelte`), so that folding
	 * the sidebar is one of the things it can do.
	 */
	const sidebar = Sidebar.useSidebar();

	/** Do it, and get out of the way. */
	function run(what: () => unknown) {
		ui.palette = false;
		void what();
	}

	type Doing = { label: string; icon: IconName; words?: string; hint?: string; run: () => unknown };

	const GO: Doing[] = [
		{ label: ACTION.label, icon: ACTION.icon, words: ACTION.words, run: () => goto(ACTION.href) },
		...PLACES.map((m) => ({ label: `Go to ${m.label}`, icon: m.icon, words: m.words, run: () => goto(m.href) }))
	];
	const VIEW: Doing[] = [
		{ label: 'Toggle sidebar', icon: 'panel-left', words: 'hide show fold left navigation', hint: '⌘B', run: () => sidebar.toggle() },
		{ label: 'Toggle right panel', icon: 'panel-right', words: 'hide show fold inspector details', hint: '⌘I', run: () => (ui.inspector = !ui.inspector) },
		{ label: 'Toggle bottom bar', icon: 'chevron-up', words: 'hide show fold dock activity log', hint: '⌘`', run: () => (ui.dockOpen = !ui.dockOpen) }
	];
	// Light or dark, and the look: two choices here as in Settings, and each is kept as it is chosen.
	const LOOK: Doing[] = [
		...MODES.map((m) => ({ label: `Mode: ${m.label}`, icon: m.icon, words: 'appearance theme dark light system', run: () => appearance.set({ mode: m.value }) })),
		...LOOKS.map((l) => ({ label: `Look: ${l.label}`, icon: 'palette' as const, words: 'appearance theme colors', run: () => appearance.set({ look: l.value }) }))
	];
	const SETTINGS: Doing[] = [
		{ label: 'Open settings', icon: 'sliders-horizontal', words: 'preferences options', run: () => (ui.settings = 'appearance') },
		...SETTINGS_SECTIONS.map((s) => ({ label: s.label, icon: s.icon, words: `settings ${s.words}`, run: () => (ui.settings = s.key) }))
	];
	const GROUPS = [
		{ heading: 'Go', items: GO },
		{ heading: 'View', items: VIEW },
		{ heading: 'Theme', items: LOOK },
		{ heading: 'Settings', items: SETTINGS }
	];
</script>

<svelte:window
	onkeydown={(e) => {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			ui.palette = !ui.palette;
		}
	}}
/>

<Dialog.Root bind:open={ui.palette}>
	<Dialog.Content class="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden rounded-2xl p-0">
		<Dialog.Title class="sr-only">Search</Dialog.Title>
		<Command.Root class="rounded-none! bg-transparent p-0">
			<Command.Input placeholder="Search places, actions, settings…" />
			<Command.List class="max-h-[26rem] p-1.5">
				<Command.Empty class="px-3 py-6 text-center text-[13px] text-muted-foreground">Nothing by that name.</Command.Empty>

				{#each GROUPS as g (g.heading)}
					<Command.Group heading={g.heading}>
						{#each g.items as d (d.label)}
							<Command.Item value="{g.heading} {d.label}" keywords={d.words?.split(' ')} onSelect={() => run(d.run)}>
								<Icon name={d.icon} class="size-4 opacity-70" />
								{d.label}
								{#if d.hint}<Command.Shortcut>{d.hint}</Command.Shortcut>{/if}
							</Command.Item>
						{/each}
					</Command.Group>
				{/each}
			</Command.List>
		</Command.Root>
	</Dialog.Content>
</Dialog.Root>
