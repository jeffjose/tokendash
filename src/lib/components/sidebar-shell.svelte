<script lang="ts">
	import { fly } from 'svelte/transition';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { ui } from '#lib/ui.svelte.js';
	import type { ComponentProps, Snippet } from 'svelte';

	/**
	 * Two states, not three. Pinned, the nav is a column that costs width; folded,
	 * it is gone — no rail, no icon strip, nothing reserved. The only thing left on
	 * screen is one icon in the top-left corner, and putting the pointer on it
	 * floats the *whole* nav back over the page until the pointer leaves.
	 *
	 * The middle state is what we dropped: a 3.5rem rail of unlabeled icons that
	 * needed a tooltip each to be usable — a menu that costs a column to say less
	 * than a menu, and which had to grow hover flyouts of its own for Accounts and
	 * Manage before their lists were reachable at all. Folding to nothing and
	 * peeking on hover gives the width back without giving up the labels.
	 *
	 * The nav body is a snippet so it can be rendered twice from one definition —
	 * once pinned in the shell, once floating in the peek. `inPeek` is only for the
	 * parts that must not run twice (see `reportMenu`).
	 */
	let {
		body,
		...restProps
	}: {
		body: Snippet<
			[{ inPeek: boolean; dismiss: () => void; reportMenu: (open: boolean) => void }]
		>;
	} & ComponentProps<typeof Sidebar.Root> = $props();

	const sidebar = Sidebar.useSidebar();

	// The trigger lives at the top of each page (`sidebar-toggle`); this only reads it.
	const hovering = $derived(ui.peekLeft);

	// Opening is a plain mouseenter on the corner. *Closing* is not the matching
	// mouseleave, because that fires on every pixel of daylight the pointer finds
	// — the gap a rounded corner leaves, the sliver between the icon and the
	// panel's edge, a portalled menu that is technically elsewhere in the DOM —
	// and each one reads as a flicker you didn't ask for.
	//
	// So the panel closes on distance, not on boundaries: it stays until the
	// pointer is a clear margin outside its own rectangle. One rule, no seams, and
	// the panel's own layout can change underneath it without consequence — which
	// matters here, where expanding Accounts changes the panel's height mid-hover.
	const ESCAPE_PX = 32;
	// And once outside, it has this long to come back. Leaving is usually a slip —
	// an overshoot on the way to a nav row, a pass over the panel on the way
	// somewhere else — and closing on the first frame outside punishes both.
	const LINGER_MS = 400;

	let menuOpen = $state(false);
	const peeking = $derived(hovering || menuOpen);

	let panel = $state<HTMLElement | null>(null);
	let closing: ReturnType<typeof setTimeout> | undefined;

	function stay() {
		clearTimeout(closing);
		closing = undefined;
	}

	/** Called by the page's toggle on mouseenter. */
	export function enter() {
		stay();
		ui.peekLeft = true;
	}

	/**
	 * Folding and unfolding are both a fresh start for the peek.
	 *
	 * Nothing else clears `hovering`, and pinning the sidebar *from* the peek never
	 * involves the pointer leaving the corner — so it would stay true while the
	 * whole folded block was unmounted, and the next collapse would re-render the
	 * panel already open, hanging where the sidebar had just slid away from.
	 */
	$effect(() => {
		sidebar.open;
		stay();
		ui.peekLeft = false;
		menuOpen = false;
	});

	/**
	 * Picking a destination is the end of the errand.
	 *
	 * On desktop the pointer is still on the panel, so nothing else will close it —
	 * do it by hand, and without the grace period, since this exit was deliberate.
	 * On a phone the sidebar is the provider's `openMobile` sheet instead, and
	 * closing one has never closed the other; without this a nav link navigates
	 * behind a sheet that is still up.
	 */
	function dismiss() {
		stay();
		ui.peekLeft = false;
		if (sidebar.isMobile) sidebar.setOpenMobile(false);
	}

	// Only the peek copy reports up: the pinned copy's menus are none of the
	// panel's business, and letting both write here would hold the peek open on a
	// menu opened offscreen.
	function reportMenu(open: boolean) {
		menuOpen = open;
	}

	$effect(() => {
		if (!peeking) return;

		const goAway = () => {
			if (closing) return;
			closing = setTimeout(() => {
				closing = undefined;
				ui.peekLeft = false;
			}, LINGER_MS);
		};

		const onMove = (e: PointerEvent) => {
			// The account menu portals to <body> and can sit outside the panel, so
			// while it is open the pointer is allowed anywhere.
			if (menuOpen) return stay();
			const box = panel;
			if (!box) return;
			const r = box.getBoundingClientRect();
			const out =
				e.clientX < r.left - ESCAPE_PX ||
				e.clientX > r.right + ESCAPE_PX ||
				e.clientY < r.top - ESCAPE_PX ||
				e.clientY > r.bottom + ESCAPE_PX;
			out ? goAway() : stay();
		};

		// Leaving the window is the one exit a pointer can make without a move event
		// landing outside the panel.
		const onOut = () => !menuOpen && goAway();

		window.addEventListener('pointermove', onMove);
		document.addEventListener('mouseleave', onOut);
		return () => {
			window.removeEventListener('pointermove', onMove);
			document.removeEventListener('mouseleave', onOut);
			stay();
		};
	});

	/** No narrower than its controls can stand, and never so wide the page has no room. */
	const MIN = 180;
	const DEFAULT = 272;
	const fit = (px: number) =>
		typeof window === 'undefined'
			? px
			: Math.max(MIN, Math.min(px, Math.min(520, Math.max(MIN, window.innerWidth - 480))));

	let dragging = $state(false);

	function drag(e: PointerEvent) {
		if (e.button !== 0) return;
		e.preventDefault();
		const startX = e.clientX;
		const startW = ui.sidebarWidth;
		dragging = true;
		const move = (m: PointerEvent) => {
			ui.sidebarWidth = fit(startW + (m.clientX - startX));
		};
		const done = () => {
			window.removeEventListener('pointermove', move);
			dragging = false;
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', done, { once: true });
	}

	function nudge(e: KeyboardEvent) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		ui.sidebarWidth = fit(ui.sidebarWidth + (e.key === 'ArrowRight' ? 16 : -16));
	}
</script>

<!-- `offcanvas`, so folding takes the whole panel off the left edge and the gap it
     was holding open collapses to zero. -->
<Sidebar.Root
	collapsible="offcanvas"
	{dragging}
	{...restProps}
>
	{@render body({ inPeek: false, dismiss, reportMenu: () => {} })}
	{#if sidebar.open}
		<!-- The right edge it is dragged by: a line that shows when it is under the
		     pointer. Twice clicked, it goes back to the width it came with. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (a separator that can be moved is a control) -->
		<div
			role="separator"
			aria-orientation="vertical"
			aria-label="Width of the sidebar"
			aria-valuenow={ui.sidebarWidth}
			tabindex="0"
			onpointerdown={drag}
			ondblclick={() => (ui.sidebarWidth = DEFAULT)}
			onkeydown={nudge}
			class="group/edge absolute inset-y-0 -right-1.5 z-30 w-3 cursor-col-resize outline-none"
		>
			<div class="mx-auto h-full w-0.5 transition-colors group-hover/edge:bg-foreground/40 group-focus-visible/edge:bg-foreground/40 {dragging ? 'bg-foreground/60' : ''}"></div>
		</div>
	{/if}
</Sidebar.Root>

{#if dragging}
	<!-- While dragging, the pointer is a resize arrow wherever it goes, and nothing under it is selected. -->
	<div class="fixed inset-0 z-50 cursor-col-resize select-none"></div>
{/if}

<!-- Folded, the rail floats back on hover — but the thing you hover is the tab
     bar's own toggle, not a chip of the rail's. One control per side: hover to
     look, click to pin. See `ui.peekLeft`.

     Mobile keeps the off-canvas sheet and its trigger in the layout header; a
     hover affordance is not reachable there. -->
{#if !sidebar.open && peeking}
	<div class="fixed left-0 top-12 z-70 hidden p-1.5 md:block">
		<!-- Sized like the pinned rail in width and to its content in height, capped
		     so a tall nav cannot outgrow a short viewport. The cap does not scroll
		     the panel — <Sidebar.Content> is already `flex-1 overflow-auto`, so it
		     takes the overflow and the wordmark stays pinned. -->
		<div
			bind:this={panel}
			class="flex max-h-[80svh] w-(--sidebar-width) flex-col overflow-hidden rounded-lg border bg-popover/95 py-1 text-popover-foreground shadow-lg backdrop-blur"
			transition:fly={{ y: -6, duration: 120 }}
		>
			{@render body({ inPeek: true, dismiss, reportMenu })}
		</div>
	</div>
{/if}
