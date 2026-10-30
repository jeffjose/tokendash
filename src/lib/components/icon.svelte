<script lang="ts">
	import type { IconName } from '#lib/icons.js';

	/**
	 * `<Icon name="panel-left" />`. The name is typed against the map, so a
	 * misspelling is a build error rather than a hole in the interface.
	 *
	 * It is two elements and nothing more: the drawing itself is in the page
	 * once (`SPRITE`, in the layout), and this points at it. The drawing says
	 * how it is drawn (a line of one weight, in the color of the text round
	 * it); this says only how big.
	 */
	let { name, class: className = 'size-4' }: { name: IconName; class?: string; fill?: boolean } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="shrink-0 {className}"><use href="#icon-{name}" /></svg>
