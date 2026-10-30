/**
 * One person's usage as the collectors send it (`collect/`), and what the page
 * reads off it. A file per person in `static/data/` for now, made of one file
 * from each of their machines; a database later, with the same shape coming
 * out of it.
 */

import PRICES from '#lib/prices.json';

export type Tokens = { input: number; output: number; cache_write: number; cache_read: number; messages: number };
/**
 * Tokens with what they would have cost at the maker's API prices (`prices.ts`), in dollars; what reading from the
 * cache saved against reading the same in fresh; and how many tokens were of a model with no price known, which
 * cost nothing here and are said apart so that nothing is passed off as free.
 */
export type Spent = Tokens & { cost: number; saved: number; unpriced: number };
/** A day as a machine keeps it: for each tool, its sessions, its responses by the hour, and what each model spent. */
export type Kept = { date: string; tools: Record<string, { sessions: number; hours?: number[]; models: Record<string, Tokens> }> };
/** What one machine counted, on its own clock. */
export type Machine = { machine: { id: string; name: string }; zone: string; generated_at: string; days: Kept[] };
export type File = { handle: string; generated_at: string; machines: Machine[] };

/** One model in one tool on one machine on one day: the grain everything on the page is added up from. */
export type Row = Spent & { date: string; tool: string; model: string; maker: string; machine: string };
/** One tool's sessions on one machine on one day, and its responses in each hour of it. A session is counted by its tool, not by its model. */
export type Sessions = { date: string; tool: string; machine: string; sessions: number; hours: number[] };
export type Usage = { handle: string; generated_at: string; zone: string; machines: string[]; rows: Row[]; sessions: Sessions[] };
/** Anything added up: a day, a tool, a model. */
export type Sum = Spent & { sessions: number };
export type Day = Sum & { date: string; rows: Row[] };

const KEYS = ['input', 'output', 'cache_write', 'cache_read', 'messages', 'cost', 'saved', 'unpriced'] as const;
const zero = (): Sum => ({ input: 0, output: 0, cache_write: 0, cache_read: 0, messages: 0, cost: 0, saved: 0, unpriced: 0, sessions: 0 });
export function sum(rows: Spent[]): Spent {
	const s: Spent = { input: 0, output: 0, cache_write: 0, cache_read: 0, messages: 0, cost: 0, saved: 0, unpriced: 0 };
	for (const r of rows) for (const k of KEYS) s[k] += r[k];
	return s;
}

type Price = { input: number; output: number; cache_write: number | null; cache_read: number | null };
const LIST = PRICES.models as Record<string, Price>;
/** Where the prices are from, and as of when: said on the page beside what they come to. */
export const PRICED = { source: PRICES.source, as_of: PRICES.as_of };

/**
 * A model's price, by its id as the tool wrote it: as it is, without a router's prefix, without a dated snapshot's
 * date. A model given away (":free", "-free") costs nothing and is known to; one with no price is null.
 */
export function priceOf(id: string): Price | null {
	const bare = id.replace(/^.*\//, '');
	if (/(:|-)free$/.test(bare)) return { input: 0, output: 0, cache_write: 0, cache_read: 0 };
	const name = bare.replace(/:.*$/, '');
	return LIST[name] ?? LIST[name.replace(/-\d{8}$/, '')] ?? null;
}

/**
 * What tokens cost at a price. A cache write with no price of its own is priced as input, and a cache read too: the
 * maker charges it as that. Every cache write is priced at the five-minute rate, since the tools do not keep how
 * many were for the hour, which costs more.
 */
function spend(t: Tokens, p: Price | null): Spent {
	if (!p) return { ...t, cost: 0, saved: 0, unpriced: total(t) };
	const read = p.cache_read ?? p.input;
	const cost = (t.input * p.input + t.output * p.output + t.cache_write * (p.cache_write ?? p.input) + t.cache_read * read) / 1e6;
	return { ...t, cost, saved: (t.cache_read * (p.input - read)) / 1e6, unpriced: 0 };
}

/**
 * The machines' files, laid out flat and added up as one. A machine is said by its name, and by its name with the
 * end of its id where two have the same one. Each machine's days are its own clock's: a day is the day it was where
 * the work was done.
 */
export function read(file: File): Usage {
	const rows: Row[] = [];
	const sessions: Sessions[] = [];
	const named = (m: Machine) => (file.machines.filter((o) => o.machine.name === m.machine.name).length > 1 ? `${m.machine.name} ${m.machine.id.slice(0, 4)}` : m.machine.name);
	for (const m of file.machines) {
		const machine = named(m);
		for (const d of m.days) {
			for (const [tool, t] of Object.entries(d.tools)) {
				sessions.push({ date: d.date, tool, machine, sessions: t.sessions, hours: t.hours ?? [] });
				for (const [model, n] of Object.entries(t.models)) rows.push({ ...spend(n, priceOf(model)), date: d.date, tool, model, maker: makerOf(model), machine });
			}
		}
	}
	// "Today" is on the clock of the machine heard from last.
	const zone = file.machines[0]?.zone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
	return { handle: file.handle, generated_at: file.generated_at, zone, machines: file.machines.map(named), rows, sessions };
}

/** Each day that had anything, oldest first, with what it was made of. */
export function daysOf(rows: Row[], sessions: Sessions[]): Day[] {
	const by = new Map<string, Day>();
	for (const r of rows) {
		let d = by.get(r.date);
		if (!d) by.set(r.date, (d = { ...zero(), date: r.date, rows: [] }));
		for (const k of KEYS) d[k] += r[k];
		d.rows.push(r);
	}
	// Only the sessions of tools that are still in: a day read for Codex alone has Codex's sessions, not Claude Code's.
	const tools = new Set(rows.map((r) => `${r.date} ${r.tool} ${r.machine}`));
	for (const s of sessions) if (tools.has(`${s.date} ${s.tool} ${s.machine}`)) by.get(s.date)!.sessions += s.sessions;
	return [...by.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** The rows added up by one of what they are (tool, maker, model), the most first. */
export function group(rows: Row[], by: 'tool' | 'maker' | 'model' | 'machine'): (Spent & { name: string })[] {
	const parts = new Map<string, Row[]>();
	for (const r of rows) parts.set(r[by], [...(parts.get(r[by]) ?? []), r]);
	return [...parts].map(([name, rs]) => ({ name, ...sum(rs) })).sort((a, b) => total(b) - total(a));
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

/** Dollars as they are read: $12.4K, $8,006, $4.27, under a cent as <$0.01. */
export function money(n: number): string {
	if (n >= 10_000) return `$${short(n)}`;
	if (n >= 100) return `$${whole(Math.round(n))}`;
	if (n >= 0.01 || n === 0) return `$${n.toFixed(2)}`;
	return '<$0.01';
}

/** A tool by its own name. One not known here is said as it was kept. */
export const toolName = (id: string) =>
	(({ 'claude-code': 'Claude Code', codex: 'Codex', opencode: 'OpenCode', 'gemini-cli': 'Gemini CLI', amp: 'Amp', droid: 'Droid', cursor: 'Cursor', copilot: 'Copilot CLI' }) as Record<string, string>)[id] ?? id;

/**
 * Who made a model, read off its id: the same model can come through more than one tool (OpenCode can run
 * Opus), so the maker is the model's and not the tool's. A router's prefix ("google/gemma-…") names the maker
 * too. One that cannot be told is "Other".
 */
export function makerOf(id: string): string {
	const m = id.toLowerCase().replace(/^[a-z-]+\/(?=.*\/)/, '');
	if (/^(anthropic\/)?claude/.test(m)) return 'Anthropic';
	if (/^(openai\/)?(gpt|o\d|codex)/.test(m)) return 'OpenAI';
	if (/^(google\/)?(gemini|gemma)/.test(m)) return 'Google';
	if (/^(x-ai\/)?grok/.test(m)) return 'xAI';
	if (/^(deepseek\/)?deepseek/.test(m)) return 'DeepSeek';
	if (/^(qwen\/)?qwen/.test(m)) return 'Qwen';
	if (/^(moonshotai\/)?kimi/.test(m)) return 'Moonshot';
	if (/^(z-ai\/)?glm/.test(m)) return 'Zhipu';
	if (/^(mistralai\/)?(mistral|devstral|codestral)/.test(m)) return 'Mistral';
	if (/^(meta-llama\/)?llama/.test(m)) return 'Meta';
	return 'Other';
}

/**
 * A model's id as it is said: claude-opus-5-5 is Opus 5.5, a dated snapshot drops its date, gpt-5.2-codex is
 * GPT-5.2 Codex, and a router's prefix and ":free" come off.
 */
export function modelName(id: string): string {
	const bare = id.replace(/^.*\//, '').replace(/:.*$/, '');
	const c = bare.match(/^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{8})?$/);
	if (c) return `${c[1][0].toUpperCase()}${c[1].slice(1)} ${c[2]}${c[3] ? `.${c[3]}` : ''}`;
	const g = bare.match(/^gpt-([\d.]+)(?:-(.+))?$/);
	if (g) return `GPT-${g[1]}${g[2] ? ` ${g[2].split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}` : ''}`;
	const o = bare.match(/^(gemini|gemma)-(.+)$/);
	if (o) return `${o[1][0].toUpperCase()}${o[1].slice(1)} ${o[2].replace(/-it$/, '').split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}`;
	return bare;
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
