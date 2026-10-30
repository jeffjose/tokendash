<script lang="ts">
	import { Icon } from '#lib/icon.js';
	import { ui } from '#lib/ui.svelte.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';

	/**
	 * The one button that folds the sidebar away and brings it back. It is
	 * fixed in the top-left corner of the window and does not move: the button
	 * you pressed to fold the sidebar is the button under your pointer to open
	 * it again. Folded, hovering it floats the sidebar over the page.
	 */
	const sidebar = Sidebar.useSidebar();

	/**
	 * Folding must not open the peek: the pointer is still on the button that
	 * did it. So for a moment after folding, the pointer is ignored.
	 */
	let armed = $state(true);
	$effect(() => {
		if (sidebar.open) return;
		armed = false;
		const t = setTimeout(() => (armed = true), 450);
		return () => clearTimeout(t);
	});
</script>

<button
	onclick={() => sidebar.toggle()}
	onmouseenter={() => !sidebar.open && armed && (ui.peekLeft = true)}
	data-tip={sidebar.open ? 'Hide the sidebar (⌘B)' : 'Show the sidebar (⌘B). Hover to peek.'}
	aria-label={sidebar.open ? 'Hide the sidebar' : 'Show the sidebar'}
	class="fixed left-2.5 top-2 z-40 hidden size-8 place-items-center rounded-md transition-colors hover:bg-accent hover:text-foreground md:grid {ui.peekLeft
		? 'bg-accent text-foreground'
		: 'text-muted-foreground'}"
>
	<Icon name="panel-left" class="size-4" />
</button>
