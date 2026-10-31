/**
 * What every collector counts into, and how a day is kept. A collector reads
 * one tool's own records and hands back its days; `collect/index.ts` lays them
 * over the file the last run wrote.
 */

export type Tokens = { input: number; output: number; cache_write: number; cache_read: number; messages: number };
/**
 * One tool on one day, as it is kept: how many sessions, what each model spent, and the day hour by hour, on this
 * machine's clock: how many responses came in each hour, and how many tokens (every kind, added up).
 */
export type Spent = { sessions: number; hours?: number[]; hour_tokens?: number[]; models: Record<string, Tokens> };
export type Day = { date: string; tools: Record<string, Spent> };

/** One tool's days while they are counted: a session is a set so that one seen twice is one. */
export type Counted = Map<string, { sessions: Set<string>; hours: number[]; hour_tokens: number[]; models: Map<string, Tokens> }>;

export const KEYS = ['input', 'output', 'cache_write', 'cache_read', 'messages'] as const;
export const empty = (): Tokens => ({ input: 0, output: 0, cache_write: 0, cache_read: 0, messages: 0 });

export const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// The day and hour a response falls on are the ones on this machine's clock, as it was lived, not UTC's.
const clock = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });

/** Adds one response, and what it spent, to its model on the day it was on and to the hour it was in. */
export function add(
	days: Counted,
	when: Date | number | string,
	session: string | undefined,
	model: string,
	n: { input: number; output: number; cache_write?: number; cache_read?: number }
) {
	const parts = Object.fromEntries(clock.formatToParts(new Date(when)).map((p) => [p.type, p.value]));
	const date = `${parts.year}-${parts.month}-${parts.day}`;
	let day = days.get(date);
	if (!day) days.set(date, (day = { sessions: new Set(), hours: Array(24).fill(0), hour_tokens: Array(24).fill(0), models: new Map() }));
	if (session) day.sessions.add(session);
	const hour = Number(parts.hour) % 24;
	let t = day.models.get(model);
	if (!t) day.models.set(model, (t = empty()));
	t.messages += 1;
	t.input += n.input;
	t.output += n.output;
	t.cache_write += n.cache_write ?? 0;
	t.cache_read += n.cache_read ?? 0;
	day.hours[hour] += 1;
	day.hour_tokens[hour] += n.input + n.output + (n.cache_write ?? 0) + (n.cache_read ?? 0);
}

/**
 * Tools whose records say only a session's total, so a "response" in their counts is a whole session: a response's
 * size is not checked against what one response can be (`check.ts`).
 */
export const BY_SESSION = new Set(['droid']);
