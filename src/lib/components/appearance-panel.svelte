<script lang="ts">
	import { onDestroy } from 'svelte';
	import SettingGroup from '#lib/components/setting-group.svelte';
	import SettingRow from '#lib/components/setting-row.svelte';
	import { Icon } from '#lib/icon.js';
	import { ui, appearance, MODES, LOOKS, type Mode, type Look } from '#lib/ui.svelte.js';
	import { SEG, SEG_ITEM, SEG_ON, SEG_OFF } from '#lib/seg.js';
	import { FONTS, fontOf } from '#lib/fonts.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { Button } from '#lib/components/ui/button/index.js';

	/**
	 * How the app looks on this machine: light or dark, in which look, and in
	 * what face.
	 *
	 * Light or dark is a switch, and the looks are under it: two choices, and
	 * neither changes the other.
	 *
	 * Neither is kept until you press Save. Until then it is tried on, on the
	 * whole app (there is no smaller honest picture of light against dark).
	 * Leaving without saving puts it back. The face is kept as soon as it is
	 * chosen: it is gone through one after another to be compared, and a Save
	 * between each would be in the way.
	 */
	let mode = $state<Mode>(appearance.mode);
	let look = $state<Look>(appearance.look);
	// Changed from somewhere else (the search over everything) with nothing tried on here: follow it.
	let was = { mode: appearance.mode, look: appearance.look };
	$effect(() => {
		const saved = { mode: appearance.mode, look: appearance.look };
		if (mode === was.mode) mode = saved.mode;
		if (look === was.look) look = saved.look;
		was = saved;
	});

	const dirty = $derived(mode !== appearance.mode || look !== appearance.look);

	/** What is chosen goes on the whole app at once, to be seen; it is kept on Save. */
	function wear(next: { mode?: Mode; look?: Look }) {
		mode = next.mode ?? mode;
		look = next.look ?? look;
		appearance.try(mode === appearance.mode && look === appearance.look ? null : { mode, look });
	}
	function save() {
		appearance.set({ mode, look });
		appearance.try(null);
	}
	function discard() {
		mode = appearance.mode;
		look = appearance.look;
		appearance.try(null);
	}
	// Unsaved here is unsaved in Settings: its one bar keeps it or throws it away.
	$effect(() => ui.pend('appearance', dirty ? { save, discard } : null));
	// Left with something tried on and not saved: take it off.
	onDestroy(() => {
		ui.pend('appearance', null);
		appearance.try(null);
	});

	/** The font before or after the one worn, round and round. */
	const fontBy = (step: number) => appearance.setFont(FONTS[(FONTS.findIndex((f) => f.key === appearance.font) + step + FONTS.length) % FONTS.length].key);
</script>

<!-- A look, as a small picture of itself on the page it would have just now, light or dark: its page, two lines of
     its text, and a dot of the app's own color there. Drawn on its dark page while the app is light, a tile shows
     a page that pressing it does not give. -->
{#snippet tile(l: (typeof LOOKS)[number])}
	{@const on = look === l.value}
	{@const [page, ink, brand] = appearance.dark ? l.dark : l.light}
	<button onclick={() => wear({ look: l.value })} aria-pressed={on} class="group/look block w-full text-left outline-none">
		<span
			class="relative block h-16 overflow-hidden rounded-xl ring-1 transition-shadow {on
				? 'ring-2 ring-foreground'
				: 'ring-foreground/15 group-hover/look:ring-foreground/40 group-focus-visible/look:ring-foreground/60'}"
			style="background: {page}"
		>
			<span class="absolute left-2.5 top-2.5 flex items-center gap-1.5">
				<span class="size-3 rounded-full" style="background: {brand}"></span>
				<span class="h-1.5 w-14 rounded-full" style="background: {ink}; opacity: 0.7"></span>
			</span>
			<span class="absolute left-[1.6rem] top-[1.55rem] h-1.5 w-20 rounded-full" style="background: {ink}; opacity: 0.3"></span>
			<span class="absolute left-[1.6rem] top-[2.4rem] h-1.5 w-12 rounded-full" style="background: {ink}; opacity: 0.3"></span>
			{#if on}
				<span class="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-foreground text-background">
					<Icon name="check" class="size-3" />
				</span>
			{/if}
		</span>
		<span class="mt-1.5 block truncate text-[13px] {on ? 'font-medium' : 'text-muted-foreground'}">{l.label}</span>
	</button>
{/snippet}

<SettingGroup title="Theme">
	<SettingRow title="Mode" description="System is light or dark as this machine is.">
		<div class="{SEG} w-72" role="group" aria-label="Mode">
			{#each MODES as m (m.value)}
				<button onclick={() => wear({ mode: m.value })} aria-pressed={mode === m.value} class="{SEG_ITEM} flex items-center justify-center gap-1.5 {mode === m.value ? SEG_ON : SEG_OFF}">
					<Icon name={m.icon} class="size-3.5" />{m.label}
				</button>
			{/each}
		</div>
	</SettingRow>
	<SettingRow title="Look" description="Each has a light page and a dark one.">
		<span class="text-[13px] text-muted-foreground">{LOOKS.find((l) => l.value === look)?.label}</span>
		{#snippet below()}
			<div class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
				{#each LOOKS as l (l.value)}
					{@render tile(l)}
				{/each}
			</div>
		{/snippet}
	</SettingRow>
</SettingGroup>

<SettingGroup title="Type">
	<!-- The face it is set in: chosen from the list, or gone through one at a time with the arrows, the whole app set in each as it is come to. -->
	<SettingRow title="Font" description={fontOf(appearance.font).google ? 'Fetched from Google Fonts each time the app comes up.' : 'Kept with the app.'}>
		<div class="flex items-center gap-1">
			<Button variant="ghost" size="icon-sm" onclick={() => fontBy(-1)} aria-label="The font before" data-tip="The font before"><Icon name="chevron-left" class="size-4" /></Button>
			<Select.Root type="single" value={appearance.font} onValueChange={(key) => key && appearance.setFont(key)}>
				<Select.Trigger size="sm" aria-label="Font" class="h-8 w-52 text-[13px]"><span class="truncate">{fontOf(appearance.font).label}</span></Select.Trigger>
				<Select.Content class="max-h-80">
					{#each FONTS as f (f.key)}<Select.Item value={f.key} label={f.label}>{f.label}</Select.Item>{/each}
				</Select.Content>
			</Select.Root>
			<Button variant="ghost" size="icon-sm" onclick={() => fontBy(1)} aria-label="The font after" data-tip="The font after"><Icon name="chevron-right" class="size-4" /></Button>
		</div>
	</SettingRow>
</SettingGroup>
