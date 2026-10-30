<script lang="ts">
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import SaveBar from '#lib/components/save-bar.svelte';
	import AppearancePanel from '#lib/components/appearance-panel.svelte';
	import SettingGroup from '#lib/components/setting-group.svelte';
	import Empty from '#lib/components/empty.svelte';
	import { Icon } from '#lib/icon.js';
	import { ui, SETTINGS_GROUPS, SETTINGS_SECTIONS, type SettingsSection } from '#lib/ui.svelte.js';
	import { HEADING } from '#lib/styles.js';

	/**
	 * Settings: what is true of the app as a whole. It is not a place you go
	 * to: it opens over wherever you are, and closing it leaves you there. A
	 * list of sections down the left and one of them beside it, so each is
	 * short and none is scrolled past.
	 *
	 * Which section is open is the end of the address (`#settings`,
	 * `#settings/shortcuts`): see `ui.settings`.
	 */
	const open = $derived(ui.settings);
	const section = $derived(SETTINGS_SECTIONS.find((s) => s.key === open));

	/**
	 * A section saved by hand says when it has something unsaved
	 * (`ui.unsaved`). Going to another section is free: you may not be done,
	 * and what is unsaved is carried along. Closing then (the ×, Escape, a
	 * click outside) does not happen: the bar that says "Not saved yet" is
	 * what stops it, and says so. Save or Discard there, and then
	 * close.
	 */
	function leave(to: SettingsSection | null) {
		if (!to && ui.dirty) return void ui.stopped++;
		ui.settings = to;
	}

	const item = 'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] transition-colors';
</script>

<!-- Open for as long as the address says so, and not shut by the dialog itself:
     closing is asked for, and is refused with something unsaved. -->
<Dialog.Root bind:open={() => open !== null, (o) => void (!o && leave(null))}>
	<Dialog.Content class="h-[min(46rem,90svh)] max-w-6xl flex-row gap-0 overflow-hidden rounded-3xl p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
		{#if open}
			<nav class="w-56 shrink-0 space-y-0.5 overflow-y-auto border-r border-border/70 bg-foreground/[0.025] p-3" aria-label="Settings">
				<Dialog.Title class="px-2.5 pb-2 pt-1.5 text-[15px] font-medium tracking-tight">Settings</Dialog.Title>
				{#each SETTINGS_GROUPS as g (g)}
					<div class="px-2.5 pb-1 pt-3 {HEADING}">{g}</div>
					{#each SETTINGS_SECTIONS.filter((s) => s.group === g) as s (s.key)}
						<button
							onclick={() => open !== s.key && leave(s.key)}
							aria-current={open === s.key ? 'page' : undefined}
							class="{item} {open === s.key
								? 'bg-foreground/[0.09] font-medium text-foreground'
								: 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground'}"
						>
							<Icon name={s.icon} class="size-4 shrink-0" />
							<span class="flex-1">{s.label}</span>
						</button>
					{/each}
				{/each}
			</nav>

			<!-- Room is kept at the right for the ×, so nothing in a section runs under it. -->
			<div class="relative min-w-0 flex-1 overflow-y-auto pb-7 pl-7 pr-14 pt-6">
				<button
					onclick={() => leave(null)}
					aria-label="Close"
					data-tip="Close (Esc)"
					class="absolute right-3 top-4 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
				>
					<Icon name="x" class="size-4" />
				</button>
				<!-- Every section is the same thing: groups of settings
				     (`setting-group`), each a name and what it does on the left
				     and its control on the right (`setting-row`). -->
				<!-- Appearance is there for as long as Settings is, shown or not:
				     what is being tried on in it is kept while you look elsewhere. -->
				<div hidden={open !== 'appearance'}><AppearancePanel /></div>
				{#if section && open !== 'appearance'}
					<!-- Not written yet: the section has its place and its name, and nothing in it. -->
					<SettingGroup title={section.label}>
						<Empty icon={section.icon}>Nothing to set here yet.</Empty>
					</SettingGroup>
				{/if}
				<!-- One bar for all of Settings, in whichever section you are. -->
				<SaveBar />
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
