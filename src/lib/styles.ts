/**
 * How the app is set, said once. Every
 * page is the same type, the same controls and the same rows, so going from
 * one to another is not going to a different app.
 *
 * The scale, all of it:
 *   15px medium   what a page or pane is (its header bar)
 *   14px          what you read: a row's name, a paragraph
 *   13px          controls, and what is said about a row
 *   12px          asides: a count, a place, a date
 *   11px caps     the name of a section
 *
 * Medium is the only weight above regular. Nothing is bold.
 */

/** A page's or pane's name, in its header bar. */
export const TITLE = 'truncate text-[15px] font-medium tracking-tight';
/** Beside a title: how many, or where. */
export const ASIDE = 'text-[12px] text-muted-foreground';
/** The name of a section. */
export const HEADING = 'text-[12px] font-medium text-muted-foreground';

/** A group of things set apart on a page: a raised panel with a hairline round it. */
export const CARD = 'overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10';

/** A list is a card of rows. Hairlines come from the list (`ROWS`), not the row. */
export const ROWS = `divide-y divide-border/50 ${CARD}`;
export const ROW = 'flex min-h-12 items-center gap-3 px-4 py-2 text-[14px]';
export const ROW_LINK = `${ROW} transition-colors hover:bg-foreground/[0.03]`;
/** What is said about a row, under or beside its name. */
export const NOTE = 'text-[13px] text-muted-foreground';

/** A quiet button: the header's, and a row's. */
export const BTN =
	'flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40';
/** The one thing a page or row is for. */
/** What a whole page is most for, across from its name: the one filled button on it. */
export const BTN_PAGE =
	'flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-[13.5px] font-medium text-background outline-none transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50';
export const BTN_MAIN =
	'flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-foreground/10 px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground/15 disabled:pointer-events-none disabled:opacity-40';
/** As weighty as the main one, for undoing what it did: an outline that fills when you reach for it. */
export const BTN_LINE =
	'flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-foreground ring-1 ring-inset ring-foreground/35 transition-colors hover:bg-foreground hover:text-background hover:ring-foreground disabled:pointer-events-none disabled:opacity-40';
/** Something you would not want to do by accident: outlined in red, and red all through under the pointer. */
export const BTN_DANGER =
	'flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium danger ring-1 ring-inset ring-[var(--fail-9)]/50 transition-colors disabled:pointer-events-none disabled:opacity-40';
/** A button that is only an icon. */
export const BTN_ICON =
	'grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

/** Somewhere to type. */
export const FIELD =
	'w-full rounded-md border border-border bg-background/40 px-2.5 py-1.5 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/50 hover:border-foreground/25 focus:border-foreground/45';
