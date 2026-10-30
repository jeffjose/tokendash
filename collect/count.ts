/**
 * What every collector counts into, and how a day is kept. A collector reads
 * one tool's own records and hands back its days; `collect/index.ts` lays them
 * over the file the last run wrote.
 */

export type Tokens = { input: number; output: number; cache_write: number; cache_read: number; messages: number };
/** One tool on one day, as it is kept: how many sessions, responses in each hour of the day, and what each model spent. */
export type Spent = { sessions: number; hours?: number[]; models: Record<string, Tokens> };
export type Day = { date: string; tools: Record<string, Spent> };

/** One tool's days while they are counted: a session is a set so that one seen twice is one. */
export type Counted = Map<string, { sessions: Set<string>; hours: number[]; models: Map<string, Tokens> }>;

export const KEYS = ['input', 'output', 'cache_write', 'cache_read', 'messages'] as const;
export const empty = (): Tokens => ({ input: 0, output: 0, cache_write: 0, cache_read: 0, messages: 0 });

export const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// The day and hour a response falls on are the ones on this machine's clock, as it was lived, not UTC's.
const clock = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });

/** Adds one response to the day and hour it was in, and returns what it was added to so the caller can fill in the counts. */
export function add(days: Counted, when: Date | number | string, session: string | undefined, model: string): Tokens {
	const parts = Object.fromEntries(clock.formatToParts(new Date(when)).map((p) => [p.type, p.value]));
	const date = `${parts.year}-${parts.month}-${parts.day}`;
	let day = days.get(date);
	if (!day) days.set(date, (day = { sessions: new Set(), hours: Array(24).fill(0), models: new Map() }));
	if (session) day.sessions.add(session);
	day.hours[Number(parts.hour)] += 1;
	let t = day.models.get(model);
	if (!t) day.models.set(model, (t = empty()));
	t.messages += 1;
	return t;
}
