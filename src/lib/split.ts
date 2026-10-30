import { group, modelName, toolName, type Row } from '#lib/usage.js';

/**
 * What a chart's bars are split by: the tool, who made the model, the model, or the machine it was used on.
 * Each part is a step of the one
 * hue, the app's own, mixed toward the card: the most is the full color at the bottom of a bar, the next lighter
 * over it. Four steps are as many as the eye tells apart, so past four the least are one part, "3 more".
 */
export type Split = 'tool' | 'maker' | 'model' | 'machine';
export const SPLITS: { id: Split; name: string }[] = [
	{ id: 'tool', name: 'Tool' },
	{ id: 'maker', name: 'Maker' },
	{ id: 'model', name: 'Model' },
	{ id: 'machine', name: 'Machine' }
];

export const SHADES = [
	'var(--brand)',
	'color-mix(in oklab, var(--brand) 62%, var(--card))',
	'color-mix(in oklab, var(--brand) 38%, var(--card))',
	'color-mix(in oklab, var(--brand) 28%, var(--card))'
];

export type Series = { keys: string[]; name: string; color: string };

export const nameOf = (split: Split, key: string) => (split === 'tool' ? toolName(key) : split === 'model' ? modelName(key) : key);

/** The parts a split has in these rows, the most first. */
export function seriesOf(rows: Row[], split: Split): Series[] {
	const g = group(rows, split);
	const top = g.length > SHADES.length ? g.slice(0, SHADES.length - 1) : g;
	const s = top.map((p, i) => ({ keys: [p.name], name: nameOf(split, p.name), color: SHADES[i] }));
	if (g.length > top.length) {
		const rest = g.slice(top.length).map((p) => p.name);
		s.push({ keys: rest, name: `${rest.length} more`, color: SHADES[SHADES.length - 1] });
	}
	return s;
}

/** Which part a row is in. */
export const partOf = (series: Series[], row: Row, split: Split) => series.findIndex((s) => s.keys.includes(row[split]));
