<script lang="ts">
	import Icon from '#lib/components/icon.svelte';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { solidOf } from '#lib/palette.js';
	import { SEG, SEG_ITEM, SEG_OFF, SEG_ON } from '#lib/seg.js';
	import { BTN_ICON } from '#lib/styles.js';
	import { ACCENTS, appearance, LOOKS, MODES } from '#lib/ui.svelte.js';

	/**
	 * How the page looks, under one button in its corner: light or dark, the look, and the accent. A profile has no
	 * Settings to put them in, and they are quick changes, so each is kept the moment it is chosen and worn at once.
	 * Kept in this browser: it is about the screen in front of you, not the page's owner.
	 */
	const LABEL = 'text-[12px] font-medium text-muted-foreground';
	const side = $derived(appearance.dark ? 'dark' : 'light');
	// The accent that is the look's own is shown as the look's own color, on the page it is on now.
	const own = $derived(LOOKS.find((l) => l.value === appearance.look)![side][2]);
</script>

<Popover.Root>
	<Popover.Trigger class={BTN_ICON} aria-label="Appearance" data-tip="Appearance">
		<Icon name="palette" />
	</Popover.Trigger>
	<Popover.Content align="end" class="w-64 gap-4 rounded-xl p-3">
		<div class={SEG}>
			{#each MODES as m}
				<button class="{SEG_ITEM} flex items-center justify-center gap-1.5 {appearance.mode === m.value ? SEG_ON : SEG_OFF}" onclick={() => appearance.set({ mode: m.value })}>
					<Icon name={m.icon} class="size-3.5" />{m.label}
				</button>
			{/each}
		</div>

		<div class="flex flex-col gap-1.5">
			<div class={LABEL}>Look</div>
			<div class="flex flex-col">
				{#each LOOKS as l}
					{@const [page, text, brand] = l[side]}
					<button
						class="flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors hover:bg-foreground/[0.06] {appearance.look === l.value ? 'bg-foreground/[0.09]' : ''}"
						onclick={() => appearance.set({ look: l.value })}
					>
						<!-- The look as it is: its page, a line of its words, and its own color. -->
						<span class="grid size-5 shrink-0 place-items-center rounded-[5px] ring-1 ring-foreground/15" style="background: {page}">
							<span class="h-[3px] w-2.5 rounded-full" style="background: {text}"></span>
						</span>
						<span class="flex-1 text-left">{l.label}</span>
						<span class="size-2 rounded-full" style="background: {brand}"></span>
					</button>
				{/each}
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<div class={LABEL}>Accent</div>
			<div class="flex flex-wrap gap-1.5">
				{#each ACCENTS as a}
					{@const color = a.value === 'own' ? own : solidOf(a.value)}
					<button
						class="grid size-[26px] place-items-center rounded-full ring-offset-2 ring-offset-popover transition-shadow {appearance.accent === a.value ? 'ring-2 ring-foreground/70' : 'hover:ring-2 hover:ring-foreground/25'}"
						aria-label={a.label}
						aria-pressed={appearance.accent === a.value}
						data-tip={a.label}
						onclick={() => appearance.setAccent(a.value)}
					>
						<span class="size-[18px] rounded-full" style="background: {color}"></span>
					</button>
				{/each}
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
