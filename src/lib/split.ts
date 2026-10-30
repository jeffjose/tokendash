import { COLORS } from '#lib/marks.js';
import { group, makerOf, modelName, toolName, type Row } from '#lib/usage.js';

/**
 * What a chart's bars are split by: the tool, who made the model, the model, or the machine it was used on.
 *
 * A tool or a maker is drawn in its own color, the one it is known by (`marks.ts`), so Claude Code is the same
 * orange here as everywhere else. A model is its maker's color, lighter for each further model of the same maker,
 * the most used first. A machine has no color of its own and is the app's own, in steps. Past five parts the least
 * are one, "3 more", in a gray.
 */
export type Split = 'tool' | 'maker' | 'model' | 'machine';
export const SPLITS: { id: Split; name: string }[] = [
	{ id: 'tool', name: 'Tool' },
	{ id: 'maker', name: 'Maker' },
	{ id: 'model', name: 'Model' },
	{ id: 'machine', name: 'Machine' }
];

/** The app's own color in steps, mixed toward the card: for what is the app's (machines, kinds of token). */
export const SHADES = [
	'var(--brand)',
	'color-mix(in oklab, var(--brand) 62%, var(--card))',
	'color-mix(in oklab, var(--brand) 38%, var(--card))',
	'color-mix(in oklab, var(--brand) 28%, var(--card))'
];
const REST = 'color-mix(in oklab, var(--foreground) 22%, var(--card))';
const MOST = 5;

/** A color made lighter by mixing it toward the card: a step of 0 is the color itself. */
const step = (color: string, n: number) => (n === 0 ? color : `color-mix(in oklab, ${color} ${[100, 62, 40, 26][Math.min(n, 3)]}%, var(--card))`);

/**
 * What a tool or a maker is drawn in: its own color; the page's text, a little softened, where its own is black and
 * white (OpenCode); and null where none is known.
 */
export function colorOf(key: string): string | null {
	if (!(key in COLORS)) return null;
	return COLORS[key] ?? 'color-mix(in oklab, var(--foreground) 62%, var(--card))';
}

export type Series = { keys: string[]; name: string; color: string };

export const nameOf = (split: Split, key: string) => (split === 'tool' ? toolName(key) : split === 'model' ? modelName(key) : key);

/** The color of one row of a share list, by what it is a share of. */
export function fillOf(split: Split, key: string, i: number): string {
	if (split === 'machine') return SHADES[Math.min(i, SHADES.length - 1)];
	return colorOf(split === 'model' ? makerOf(key) : key) ?? REST;
}

/** The parts a split has in these rows, the most first, each with its color. */
export function seriesOf(rows: Row[], split: Split): Series[] {
	const g = group(rows, split);
	const top = g.length > MOST ? g.slice(0, MOST - 1) : g;
	const made = new Map<string, number>();
	const s = top.map((p, i) => {
		let color = fillOf(split, p.name, i);
		if (split === 'model') {
			const maker = makerOf(p.name);
			const n = made.get(maker) ?? 0;
			made.set(maker, n + 1);
			color = step(color, n);
		}
		return { keys: [p.name], name: nameOf(split, p.name), color };
	});
	if (g.length > top.length) {
		const rest = g.slice(top.length).map((p) => p.name);
		s.push({ keys: rest, name: `${rest.length} more`, color: REST });
	}
	return s;
}

/** Which part a row is in. */
export const partOf = (series: Series[], row: Row, split: Split) => series.findIndex((s) => s.keys.includes(row[split]));
