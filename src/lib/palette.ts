import * as radix from '@radix-ui/colors';

/**
 * An identity color (a person's, a project's, a label's) is one of Radix's hues, not a color somebody made up.
 *
 * Every one Radix has that is bright and not a gray: twenty-one, in the order
 * they go round the wheel, and each one comes as a ramp Radix designed for
 * exactly these jobs: step 3 for a tinted surface, 9 for a solid fill, 11 for
 * text. The browns are left out: beside the others they read as no color.
 */
export const HUES = [
	'tomato',
	'orange',
	'amber',
	'yellow',
	'lime',
	'grass',
	'green',
	'jade',
	'mint',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'iris',
	'violet',
	'purple',
	'plum',
	'pink',
	'crimson',
	'ruby'
] as const;
export type Hue = (typeof HUES)[number];

type Scale = Record<string, string>;
const light = (hue: Hue) => (radix as unknown as Record<string, Scale>)[hue];
const dark = (hue: Hue) => (radix as unknown as Record<string, Scale>)[`${hue}Dark`];

/** Step 9 of these is light enough that white text on it does not read: the ones Radix makes bright. */
const BRIGHT: Hue[] = ['amber', 'yellow', 'lime', 'mint', 'sky'];

/*
 * The steps that are not the same on a light page as on a dark one. Radix
 * draws each hue twice: text in the color (11) is bright on a dark page and
 * deep on a light one, and so with a tinted surface. Only the solid fill (9)
 * is one color for both.
 *
 * So those steps are not handed out as colors but as names
 * (`var(--hue-blue-ink)`), and what each name is depends on the page it is
 * read on: `PALETTE_CSS` says, for a light page and for a dark one.
 */
const PARTS = { surface: 3, ink: 11 } as const;
const said = (scale: (hue: Hue) => Scale) =>
	HUES.flatMap((hue) => Object.entries(PARTS).map(([part, n]) => `--hue-${hue}-${part}:${scale(hue)[`${hue}${n}`]}`)).join(';');

/** On a look that is not the app's own the tinted surface is mixed from the hue and that look's own page: Radix's is drawn for a neutral page, and on a tinted or a lifted one it reads as a hole, or not at all. */
const mixed = (part: number) => HUES.map((hue) => `--hue-${hue}-surface:color-mix(in oklab,var(--hue-${hue}-ink) ${part}%,var(--background))`).join(';');
/** Every hue's steps by name, for each kind of page. Put in the document's head once (`+layout.svelte`). */
export const PALETTE_CSS = `:root{${said(light)}}:root.dark{${said(dark)}}:root[data-look]{${mixed(10)}}:root.dark[data-look]{${mixed(16)}}`;

/**
 * Whose color: always the same one for the same name, on any machine and
 * after any reload, with nothing kept anywhere. The name is its own key.
 */
export function hueOf(name: string): Hue {
	let h = 2166136261;
	for (const ch of name.trim().toLowerCase()) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
	return HUES[(h >>> 0) % HUES.length];
}

/**
 * The color a name comes out as, as CSS variables, for an element's `style`. Everything
 * inside can then say `var(--who)` for text in it and `var(--who-solid)` for
 * a block of it.
 */
/** A hue at full strength (its step 9, the one that is a fill in either mode): what a mark that is to be seen is drawn in. Null where it is not one of the hues. */
export const solidOf = (hue: string | null | undefined): string | null => ((HUES as readonly string[]).includes(hue ?? '') ? dark(hue as Hue)[`${hue}9`] : null);

/** The same, for a hue that was chosen and not come by from a name. */
export function toneOf(hue: Hue): string {
	return `--who: var(--hue-${hue}-ink); --who-surface: var(--hue-${hue}-surface); --who-solid: ${dark(hue)[`${hue}9`]}; --who-on-solid: ${BRIGHT.includes(hue) ? "#1a1300" : "#ffffff"}`;
}

export function tone(name: string): string {
	const hue = hueOf(name);
	return `--who: var(--hue-${hue}-ink); --who-surface: var(--hue-${hue}-surface); --who-solid: ${dark(hue)[`${hue}9`]}; --who-on-solid: ${BRIGHT.includes(hue) ? '#1a1300' : '#ffffff'}`;
}

