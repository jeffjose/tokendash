<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ui } from '#lib/ui.svelte.js';

	/**
	 * The foot of Settings while anything in it is unsaved, in whichever
	 * section (`ui.unsaved`): it says so, and offers to keep all of it or
	 * throw it away. Closing Settings is stopped until then, and this bar is
	 * what says so.
	 *
	 * Flat, as the rest of the app is: a strip at the foot, and two quiet
	 * buttons of which Save is the fuller.
	 */
	let saving = $state(false);
	async function save() {
		saving = true;
		try {
			for (const s of Object.values(ui.unsaved)) await s.save();
		} finally {
			saving = false;
		}
	}
	/** Throwing it away is being done with Settings: it shuts. */
	function discard() {
		Object.values(ui.unsaved).forEach((s) => s.discard());
		ui.unsaved = {};
		ui.settings = null;
	}

	/**
	 * Closing was tried with something unsaved (`ui.stopped`). There is no second
	 * dialog to ask: this bar is the answer. It says what
	 * to do, and goes back to how it was a moment later.
	 */
	let bar = $state<HTMLElement | null>(null);
	let warned = $state(false);
	let calm: ReturnType<typeof setTimeout> | undefined;
	let seen = ui.stopped;
	$effect(() => {
		if (ui.stopped === seen) return;
		seen = ui.stopped;
		if (!bar) return;
		warned = true;
		clearTimeout(calm);
		calm = setTimeout(() => (warned = false), 2500);
	});
	$effect(() => {
		if (!ui.dirty) warned = false;
	});
	onDestroy(() => clearTimeout(calm));
</script>

<!-- Only there when there is something to save: it sits over the foot of the
     section, and with nothing to say it would only be in the way of it. -->
{#if ui.dirty}
	<!-- A strip along the foot of the section, edge to edge, as flat as the rest of the app. Asked to shut with something unsaved, it says what to do, in full weight, for a moment: nothing moves and nothing turns red. -->
	<div bind:this={bar} role="status" class="sticky -bottom-7 z-10 -mb-7 -ml-7 -mr-14 mt-6 flex h-12 items-center gap-2 border-t border-border bg-background pl-7 pr-4">
		<p class="min-w-0 flex-1 truncate text-[13px] transition-colors {warned ? 'font-medium text-foreground' : 'text-muted-foreground'}">{warned ? 'Save or discard first' : 'Not saved yet'}</p>
		<button onclick={discard} class="flex h-8 items-center rounded-md px-3 text-[13px] text-muted-foreground ring-1 ring-inset ring-border transition-colors hover:bg-foreground/[0.07] hover:text-foreground">Discard</button>
		<button onclick={save} disabled={saving} class="flex h-8 items-center rounded-md px-4 text-[13px] font-medium text-[var(--ok-11)] ring-1 ring-inset transition-colors hover:bg-[var(--ok-9)]/30 disabled:opacity-40 {warned ? 'bg-[var(--ok-9)]/35 ring-[var(--ok-9)]' : 'bg-[var(--ok-9)]/[0.18] ring-[var(--ok-9)]/45'}">{saving ? 'Saving…' : 'Save'}</button>
	</div>
{/if}
