/**
 * What Claude Code has spent on this machine, by day and by model, from the
 * transcripts it keeps in ~/.claude/projects. Only counts leave here: no
 * project names, no paths, no words from a session.
 *
 *   node collect/claude-code.ts <github-username>    writes static/data/<username>.json
 *
 * A response is logged once per piece of it (text, each tool call), every copy
 * with the same usage, so it is counted once by its message id and request id.
 * Counted twice, a day read about three times what it was.
 *
 * Claude Code deletes a transcript a month or so after its last use, so what
 * is on disk is never the whole history. Each run is laid over the file the
 * last one wrote, and keeps the larger of each count: a day whose transcripts
 * are gone stays as it was counted while they were there.
 */

import { createReadStream } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

type Tokens = { input: number; output: number; cache_write: number; cache_read: number; messages: number };
type Day = { date: string; sessions: number; models: Record<string, Tokens> };

const handle = process.argv[2];
if (!handle || !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(handle)) {
	console.error('usage: node collect/claude-code.ts <github-username>');
	process.exit(1);
}

const ROOT = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'projects');
const FILE = join(import.meta.dirname, '..', 'static', 'data', `${handle.toLowerCase()}.json`);
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// The day a response falls on is the day on this machine's clock, as it was lived, not UTC's.
const dayOf = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });

const KEYS = ['input', 'output', 'cache_write', 'cache_read', 'messages'] as const;
const empty = (): Tokens => ({ input: 0, output: 0, cache_write: 0, cache_read: 0, messages: 0 });
const days = new Map<string, { sessions: Set<string>; models: Map<string, Tokens> }>();
const seen = new Set<string>();

async function* transcripts(dir: string): AsyncGenerator<string> {
	for (const e of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, e.name);
		if (e.isDirectory()) yield* transcripts(path);
		else if (e.name.endsWith('.jsonl')) yield path;
	}
}

for await (const file of transcripts(ROOT)) {
	for await (const line of createInterface({ input: createReadStream(file), crlfDelay: Infinity })) {
		// Most lines are not a response; looking before parsing is what keeps 4 GB to seconds.
		if (!line.includes('"usage"') || !line.includes('"assistant"')) continue;
		let entry;
		try {
			entry = JSON.parse(line);
		} catch {
			continue;
		}
		const m = entry.message;
		if (entry.type !== 'assistant' || !m?.usage || !entry.timestamp) continue;
		// Claude Code's own notes ("<synthetic>") are not the model speaking, and cost nothing.
		if (!m.model || m.model === '<synthetic>') continue;
		const key = `${m.id}:${entry.requestId ?? ''}`;
		if (seen.has(key)) continue;
		seen.add(key);

		const date = dayOf.format(new Date(entry.timestamp));
		let day = days.get(date);
		if (!day) days.set(date, (day = { sessions: new Set(), models: new Map() }));
		if (entry.sessionId) day.sessions.add(entry.sessionId);
		let t = day.models.get(m.model);
		if (!t) day.models.set(m.model, (t = empty()));
		t.input += m.usage.input_tokens ?? 0;
		t.output += m.usage.output_tokens ?? 0;
		t.cache_write += m.usage.cache_creation_input_tokens ?? 0;
		t.cache_read += m.usage.cache_read_input_tokens ?? 0;
		t.messages += 1;
	}
}

// What the last run counted, under what this one did.
const kept = new Map<string, Day>();
try {
	for (const d of JSON.parse(await readFile(FILE, 'utf8')).days as Day[]) kept.set(d.date, d);
} catch {}
for (const [date, d] of days) {
	const old = kept.get(date);
	const models: Record<string, Tokens> = { ...old?.models };
	for (const [model, t] of d.models) {
		const was = models[model] ?? empty();
		models[model] = Object.fromEntries(KEYS.map((k) => [k, Math.max(was[k], t[k])])) as Tokens;
	}
	kept.set(date, { date, sessions: Math.max(old?.sessions ?? 0, d.sessions.size), models });
}

const out = {
	handle,
	generated_at: new Date().toISOString(),
	zone,
	sources: ['claude-code'],
	days: [...kept.values()].sort((a, b) => a.date.localeCompare(b.date))
};

await mkdir(join(FILE, '..'), { recursive: true });
await writeFile(FILE, JSON.stringify(out, null, '\t') + '\n');
console.log(`${out.days.length} days (${days.size} on disk now), ${seen.size} responses -> static/data/${handle.toLowerCase()}.json`);
