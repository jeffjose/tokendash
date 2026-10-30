/**
 * The one segmented control: a row of choices where one, or a run of them, is
 * lit. Said once so every such row in the app is the same row.
 *
 * The lit choice is a soft raised chip, not a solid block: it sits inside the
 * track with room around it, so two lit neighbors read as two chips side by
 * side and never as a slab jammed against the edge.
 */
export const SEG = 'flex gap-1 rounded-lg bg-foreground/[0.05] p-1';
// Each choice is as wide as the others where there is room, and never
// narrower than its own word: squeezed under that, the words ran into each
// other ("Auto0").
export const SEG_ITEM =
	'h-7 min-w-fit flex-1 whitespace-nowrap rounded-md px-1 text-[12.5px] font-medium transition-colors';
export const SEG_ON =
	'bg-foreground/[0.14] text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_16%,transparent)]';
export const SEG_OFF = 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground';
