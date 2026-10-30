/**
 * What every collector counts into, and how a day is kept. A collector reads
 * one tool's own records and hands back its days; `collect/index.ts` lays them
 * over the file the last run wrote.
 */

export type Tokens = { input: number; output: number; cache_write: number; cache_read: number; messages: number };
/** One tool on one day, as it is kept: how many sessions, and what each model spent. */
export type Spent = { sessions: number; models: Record<string, Tokens> };
export type Day = { date: string; tools: Record<string, Spent> };

/** One tool's days while they are counted: a session is a set so that one seen twice is one. */
export type Counted = Map<string, { sessions: Set<string>; models: Map<string, Tokens> }>;

export const KEYS = ['input', 'output', 'cache_write', 'cache_read', 'messages'] as const;
export const empty = (): Tokens => ({ input: 0, output: 0, cache_write: 0, cache_read: 0, messages: 0 });

const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// The day a response falls on is the day on this machine's clock, as it was lived, not UTC's.
const dayOf = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
export { zone };

/** Adds one response to the day it was on, and returns what it was added to so the caller can fill in the counts. */
export function add(days: Counted, when: Date | number | string, session: string | undefined, model: string): Tokens {
	const date = dayOf.format(new Date(when));
	let day = days.get(date);
	if (!day) days.set(date, (day = { sessions: new Set(), models: new Map() }));
	if (session) day.sessions.add(session);
	let t = day.models.get(model);
	if (!t) day.models.set(model, (t = empty()));
	t.messages += 1;
	return t;
}
