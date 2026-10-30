<script lang="ts">
	import Empty from '#lib/components/empty.svelte';
	import { Icon } from '#lib/icon.js';
	import { ui } from '#lib/ui.svelte.js';

	/**
	 * The dock under the page: it is under the middle and the pane beside it
	 * and never over them.
	 *
	 * It is a thin bar until it is asked for: one line that says how things
	 * stand, and a chevron. Clicked, it comes up to the height it was last
	 * dragged to by its top edge; clicking anywhere else (the page, the
	 * sidebar, the pane) folds it down again, so it is never in the way of
	 * what you came to do. A dialog or a menu it opened is part of it, and
	 * clicking in one does not fold it.
	 *
	 * Its parts are tabs. Nothing is in them yet.
	 */
	const NAME = 'Activity';
	const TABS = [
		{ key: 'activity', label: 'Activity' },
		{ key: 'log', label: 'Log' }
	] as const;
	const tab = $derived(TABS.find((t) => t.key === ui.dockTab)?.key ?? TABS[0].key);

	/** How things stand, in the one line that is left when the dock is folded. */
	const stands: string[] = [];

	/* Its height, dragged by the top edge: no shorter than its rows can stand, and never so tall the page has no room. */
	const MIN = 150;
	const fit = (px: number) => Math.max(MIN, Math.min(px, Math.max(MIN, window.innerHeight - 280)));
	let dock = $state<HTMLElement>();
	let dragging = $state(false);
	let height = $state(ui.dockHeight);
	$effect(() => {
		if (!dragging) height = ui.dockHeight;
	});
	function drag(e: PointerEvent) {
		if (e.button !== 0 || !dock) return;
		e.preventDefault();
		const bottom = dock.getBoundingClientRect().bottom;
		dragging = true;
		const move = (m: PointerEvent) => (height = fit(bottom - m.clientY));
		const done = () => {
			window.removeEventListener('pointermove', move);
			dragging = false;
			ui.dockHeight = height;
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', done, { once: true });
	}
	function step(e: KeyboardEvent) {
		if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
		e.preventDefault();
		ui.dockHeight = fit(ui.dockHeight + (e.key === 'ArrowUp' ? 16 : -16));
	}

	/** What the dock puts up outside itself: a dialog, a menu, a tip. Clicking in one is not clicking away. */
	const OURS = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [data-bits-floating-content-wrapper], [data-sonner-toaster]';

	const HEAD = 'flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-[12px] transition-colors';
</script>

<svelte:window
	onkeydown={(e) => {
		// Ctrl or ⌘ with the key under Esc, as a terminal's panel is brought up.
		if (e.code === 'Backquote' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			ui.dockOpen = !ui.dockOpen;
		}
	}}
	onpointerdown={(e) => {
		// Anything clicked that is not the dock, or something the dock put up, folds it down.
		if (!ui.dockOpen || dragging || !(e.target instanceof Element)) return;
		if (dock?.contains(e.target) || e.target.closest(OURS)) return;
		ui.dockOpen = false;
	}}
/>

<section
	bind:this={dock}
	aria-label={NAME}
	class="relative flex shrink-0 flex-col border-t border-border bg-sidebar text-sidebar-foreground"
	style={ui.dockOpen ? `height: ${height}px` : ''}
>
	{#if ui.dockOpen}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (a separator that can be moved is a control) -->
		<div
			role="separator"
			aria-orientation="horizontal"
			aria-label="Height of the dock"
			aria-valuenow={height}
			tabindex="0"
			onpointerdown={drag}
			ondblclick={() => (ui.dockHeight = 288)}
			onkeydown={step}
			class="group/edge absolute inset-x-0 -top-1.5 z-30 h-3 cursor-row-resize outline-none"
		>
			<div class="mt-[5px] h-0.5 w-full transition-colors group-hover/edge:bg-foreground/40 group-focus-visible/edge:bg-foreground/40 {dragging ? 'bg-foreground/60' : ''}"></div>
		</div>
	{/if}

	{#snippet stood()}
		<p class="min-w-0 flex-1 truncate text-left text-[12px] text-muted-foreground">
			{#each stands as part, i (i)}{#if i}<span class="mx-1 opacity-50">·</span>{/if}{part}{/each}
		</p>
	{/snippet}

	{#if !ui.dockOpen}
		<!-- Folded, it is one thin bar, and all of it brings the dock up. -->
		<button
			onclick={() => (ui.dockOpen = true)}
			aria-label="Bring the dock up"
			aria-expanded="false"
			data-tip="Bring up (Ctrl+backtick)"
			class="flex h-7 w-full shrink-0 items-center gap-1 pl-3 pr-2.5 outline-none transition-colors hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05]"
		>
			<span class="mr-1.5 text-[12px] font-medium">{NAME}</span>
			{@render stood()}
			<Icon name="chevron-up" class="size-4 shrink-0 text-muted-foreground" />
		</button>
	{:else}
		<!-- Up: what it is, its parts, how things stand, and the way to fold it. -->
		<header class="flex h-8 shrink-0 items-center gap-1 border-b border-border/60 pl-3 pr-1.5">
			<span class="mr-1.5 text-[12px] font-medium">{NAME}</span>
			{#each TABS as t (t.key)}
				<button
					onclick={() => (ui.dockTab = t.key)}
					aria-pressed={tab === t.key}
					class="{HEAD} text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground aria-pressed:bg-foreground/10 aria-pressed:text-foreground"
				>
					{t.label}
				</button>
			{/each}
			<span class="mx-1.5 h-3.5 w-px bg-border"></span>
			{@render stood()}
			<button
				onclick={() => (ui.dockOpen = false)}
				aria-label="Fold the dock down"
				aria-expanded="true"
				data-tip="Fold down (Ctrl+backtick)"
				class="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
			>
				<Icon name="chevron-down" class="size-4" />
			</button>
		</header>
		<div class="min-h-0 flex-1 overflow-y-auto">
			<Empty icon="chevron-up" class="py-8">Nothing here yet.</Empty>
		</div>
	{/if}
</section>

{#if dragging}
	<!-- While dragging, the pointer is a resize arrow wherever it goes, and nothing under it is selected. -->
	<div class="fixed inset-0 z-50 cursor-row-resize select-none"></div>
{/if}
