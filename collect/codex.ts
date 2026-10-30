/**
 * What Codex has spent on this machine, from the session logs it keeps in
 * ~/.codex/sessions (a file a session, under the day it began).
 *
 * Codex says what a response cost in a `token_count` event, and says the same
 * event again when only the rate limits changed: the running total is what
 * tells a new response from a repeat. The model is the one named by the last
 * `turn_context` before it.
 *
 * OpenAI counts the cached part of the input inside the input, where Anthropic
 * counts it beside it; it is taken out here so that "read in" means the same
 * for both. Reasoning is inside the output already.
 */

import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { add, type Counted } from './count.ts';

async function* logs(dir: string): AsyncGenerator<string> {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const e of entries) {
		const path = join(dir, e.name);
		if (e.isDirectory()) yield* logs(path);
		else if (e.name.endsWith('.jsonl')) yield path;
	}
}

export async function codex(): Promise<Counted> {
	const root = join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'sessions');
	const days: Counted = new Map();
	for await (const file of logs(root)) {
		let session: string | undefined;
		let model = 'gpt';
		let last = -1;
		for await (const line of createInterface({ input: createReadStream(file), crlfDelay: Infinity })) {
			if (!line.includes('"session_meta"') && !line.includes('"turn_context"') && !line.includes('"token_count"')) continue;
			let entry;
			try {
				entry = JSON.parse(line);
			} catch {
				continue;
			}
			const p = entry.payload;
			if (entry.type === 'session_meta') session = p?.id ?? p?.session_id;
			else if (entry.type === 'turn_context' && p?.model) model = p.model;
			else if (entry.type === 'event_msg' && p?.type === 'token_count' && p.info?.last_token_usage) {
				const running = p.info.total_token_usage?.total_tokens ?? -1;
				if (running === last) continue;
				last = running;
				const u = p.info.last_token_usage;
				const cached = u.cached_input_tokens ?? 0;
				const t = add(days, entry.timestamp, session, model);
				t.input += Math.max(0, (u.input_tokens ?? 0) - cached);
				t.output += u.output_tokens ?? 0;
				t.cache_write += u.cache_write_input_tokens ?? 0;
				t.cache_read += cached;
			}
		}
	}
	return days;
}
