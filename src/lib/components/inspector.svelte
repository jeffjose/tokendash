<script lang="ts">
	import { ui } from '#lib/ui.svelte.js';
	import type { Snippet } from 'svelte';

	/**
	 * The right pane: open it is a column that costs width, closed it is gone.
	 * It is opened from the conversation's header, on the part that was asked
	 * for, and closed from its own corner. Its left edge is dragged to make it
	 * wider or narrower, and it stays as wide as it was left. Expanded
	 * (`ui.inspectorWide`) it takes the whole middle, for when there is
	 * something to write in it.
	 *
	 * It is a separate component rather than a second `<Sidebar.Root side="right">`
	 * because the shadcn sidebar keeps its state in a single context symbol —
	 * nesting two providers makes them fight over the same key, and ⌘B would
	 * toggle both.
	 */
	let { open = $bindable(true), body }: { open?: boolean; body: Snippet } = $props();

	/** No narrower than its contents can stand, and never so wide the conversation has no room. */
	const MIN = 320;
	const DEFAULT = 336;
	const fit = (px: number) => Math.max(MIN, Math.min(px, Math.max(MIN, window.innerWidth - 640)));

	let pane = $state<HTMLElement>();
	let dragging = $state(false);
	/** The width while it is being dragged: kept only once the edge is let go. */
	let width = $state(ui.inspectorWidth);
	$effect(() => {
		// Held to what it can be now: a width kept from before the least was raised, or from a wider window.
		if (!dragging) width = fit(ui.inspectorWidth);
	});

	function drag(e: PointerEvent) {
		if (e.button !== 0 || !pane) return;
		e.preventDefault();
		const right = pane.getBoundingClientRect().right;
		dragging = true;
		const move = (m: PointerEvent) => (width = fit(right - m.clientX));
		const done = () => {
			window.removeEventListener('pointermove', move);
			dragging = false;
			ui.inspectorWidth = width;
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', done, { once: true });
	}
	function nudge(e: KeyboardEvent) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		ui.inspectorWidth = fit(ui.inspectorWidth + (e.key === 'ArrowLeft' ? 16 : -16));
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
	}}
/>

{#if open}
	<aside
		bind:this={pane}
		class="relative hidden border-l border-border bg-sidebar text-sidebar-foreground md:flex md:flex-col {ui.inspectorWide ? 'min-w-0 flex-1' : 'shrink-0'}"
		style={ui.inspectorWide ? '' : `width: ${width}px; max-width: 70vw`}
	>
		{#if !ui.inspectorWide}
			<!-- The edge it is dragged by: a line that shows when it is under the
			     pointer. Twice clicked, it goes back to the width it came with. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (a separator that can be moved is a control) -->
			<div
				role="separator"
				aria-orientation="vertical"
				aria-label="Width of the pane"
				aria-valuenow={width}
				tabindex="0"
				onpointerdown={drag}
				ondblclick={() => (ui.inspectorWidth = DEFAULT)}
				onkeydown={nudge}
				class="group/edge absolute inset-y-0 -left-1.5 z-30 w-3 cursor-col-resize outline-none"
			>
				<div class="mx-auto h-full w-0.5 transition-colors group-hover/edge:bg-foreground/40 group-focus-visible/edge:bg-foreground/40 {dragging ? 'bg-foreground/60' : ''}"></div>
			</div>
		{/if}
		{@render body()}
	</aside>
{/if}

{#if dragging}
	<!-- While dragging, the pointer is a resize arrow wherever it goes, and nothing under it is selected. -->
	<div class="fixed inset-0 z-50 cursor-col-resize select-none"></div>
{/if}
