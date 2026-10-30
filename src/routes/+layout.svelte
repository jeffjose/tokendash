<script lang="ts">
	import '@fontsource-variable/geist';
	import '@fontsource-variable/fira-code';
	import '../app.css';
	import Tooltips from '#lib/components/tooltips.svelte';
	import { accentCss, PALETTE_CSS } from '#lib/palette.js';
	import { ACCENTS } from '#lib/ui.svelte.js';
	import { SPRITE } from '#lib/icons.js';

	let { children } = $props();

	// A profile is a page you read down, not an app you work in: none of the seed's shell (sidebar, dock,
	// palette) is put up, only its type, color and hints. The pieces are still in `#lib/components` for
	// when there is something to work in.
</script>

<!-- Every identity color, as it is on a light page and on a dark one, and the accents that can be chosen (`palette.ts`). -->
<svelte:head>
	{@html `<style>${PALETTE_CSS}${accentCss(ACCENTS.map((a) => a.value))}</style>`}
</svelte:head>

<Tooltips />

<!-- The drawing of every icon, once: each icon on the page points at its drawing here (`#lib/icons.js`). -->
<svg aria-hidden="true" width="0" height="0" class="absolute">{@html SPRITE}</svg>

{@render children()}
