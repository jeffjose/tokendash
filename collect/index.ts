/**
 * What the coding tools on this machine have spent, by day, tool and model.
 * Only counts leave here: no project names, no paths, no words from a session.
 *
 *   node collect/index.ts <github-username>    writes static/data/<username>.json
 *
 * The tools delete their own records after a while (Claude Code a month or so
 * after a transcript's last use), so what is on disk is never the whole
 * history. Each run is laid over the file the last one wrote, and keeps the
 * larger of each count: a day whose records are gone stays as it was counted
 * while they were there.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { claudeCode } from './claude-code.ts';
import { KEYS, empty, zone, type Counted, type Day, type Spent, type Tokens } from './count.ts';

const TOOLS: Record<string, () => Promise<Counted>> = { 'claude-code': claudeCode };

const handle = process.argv[2];
if (!handle || !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(handle)) {
	console.error('usage: node collect/index.ts <github-username>');
	process.exit(1);
}
const FILE = join(import.meta.dirname, '..', 'static', 'data', `${handle.toLowerCase()}.json`);

// What the last run counted, under what this one did. A file from before there was more than one tool has each
// day's models at its top, and they were all Claude Code's.
const kept = new Map<string, Day>();
try {
	for (const d of JSON.parse(await readFile(FILE, 'utf8')).days) {
		kept.set(d.date, d.tools ? d : { date: d.date, tools: { 'claude-code': { sessions: d.sessions, models: d.models } } });
	}
} catch {}

const said: string[] = [];
for (const [tool, count] of Object.entries(TOOLS)) {
	const days = await count();
	let responses = 0;
	for (const [date, d] of days) {
		const day = kept.get(date) ?? { date, tools: {} };
		const old: Spent | undefined = day.tools[tool];
		const models: Record<string, Tokens> = { ...old?.models };
		for (const [model, t] of d.models) {
			const was = models[model] ?? empty();
			models[model] = Object.fromEntries(KEYS.map((k) => [k, Math.max(was[k], t[k])])) as Tokens;
			responses += t.messages;
		}
		day.tools[tool] = { sessions: Math.max(old?.sessions ?? 0, d.sessions.size), models };
		kept.set(date, day);
	}
	said.push(`${tool}: ${days.size} days, ${responses} responses on disk`);
}

const out = {
	handle,
	generated_at: new Date().toISOString(),
	zone,
	days: [...kept.values()].sort((a, b) => a.date.localeCompare(b.date))
};

await mkdir(join(FILE, '..'), { recursive: true });
await writeFile(FILE, JSON.stringify(out, null, '\t') + '\n');
console.log(`${said.join('; ')}\n${out.days.length} days kept -> static/data/${handle.toLowerCase()}.json`);
