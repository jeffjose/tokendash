/**
 * One person's usage as the collector writes it (`collect/claude-code.ts`), and
 * what the page reads off it. A file per person in `static/data/` for now; a
 * database later, with the same shape coming out of it.
 */

export type Tokens = { input: number; output: number; cache_write: number; cache_read: number; messages: number };
/** A day as it is kept: what each model spent on it. */
export type Kept = { date: string; sessions: number; models: Record<string, Tokens> };
/** A day as the page reads it: the same, with its models added up. */
export type Day = Tokens & Kept;
export type Model = Tokens & { model: string };
export type Usage = { handle: string; generated_at: string; zone: string; sources: string[]; days: Day[]; models: Model[] };

const KEYS = ['input', 'output', 'cache_write', 'cache_read', 'messages'] as const;
const sum = (ts: Tokens[]): Tokens =>
	Object.fromEntries(KEYS.map((k) => [k, ts.reduce((n, t) => n + t[k], 0)])) as Tokens;

/** The kept file, added up the two ways the page reads it: each day over its models, and each model over the days. */
export function read(file: Omit<Usage, 'days' | 'models'> & { days: Kept[] }): Usage {
	const days = file.days.map((d) => ({ ...d, ...sum(Object.values(d.models)) }));
	const ids = [...new Set(file.days.flatMap((d) => Object.keys(d.models)))];
	const models = ids
		.map((model) => ({ model, ...sum(file.days.flatMap((d) => d.models[model] ?? [])) }))
		.sort((a, b) => total(b) - total(a));
	return { ...file, days, models };
}

/** Every token, whatever it was: what was read in, written out, and put in or read back from the cache. */
export const total = (t: Tokens) => t.input + t.output + t.cache_write + t.cache_read;

/** 1.2B, 340M, 12K, 950: three figures at most, so a column of them lines up by eye. */
export function short(n: number): string {
	for (const [size, unit] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']] as const) {
		if (n >= size) {
			const v = n / size;
			return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1).replace(/\.0$/, '') : v.toFixed(2).replace(/\.?0+$/, '')) + unit;
		}
	}
	return String(Math.round(n));
}

export const whole = (n: number) => n.toLocaleString('en-US');

/** A model's id as it is said: claude-opus-5-5 is Opus 5.5, and a dated snapshot drops its date. */
export function modelName(id: string): string {
	const m = id.match(/^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{8})?$/);
	if (!m) return id;
	return `${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}${m[3] ? `.${m[3]}` : ''}`;
}

/** A calendar date, 2026-10-28, as a Date at noon on that day: noon, so no zone's offset can move it to another. */
export const dateOf = (iso: string) => new Date(`${iso}T12:00:00`);
export const isoOf = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

/** Days in a row with anything spent: the longest run, and the one going now (today or yesterday counts as going). */
export function streaks(days: Day[], today: Date): { now: number; longest: number } {
	const used = new Set(days.filter((d) => d.messages > 0).map((d) => d.date));
	let longest = 0;
	for (const d of used) {
		if (used.has(isoOf(addDays(dateOf(d), -1)))) continue; // only count from the first day of a run
		let n = 1;
		while (used.has(isoOf(addDays(dateOf(d), n)))) n++;
		longest = Math.max(longest, n);
	}
	const start = used.has(isoOf(today)) ? today : addDays(today, -1);
	let now = 0;
	while (used.has(isoOf(addDays(start, -now)))) now++;
	return { now, longest };
}
