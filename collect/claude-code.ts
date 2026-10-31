/**
 * What Claude Code has spent on this machine, from the transcripts it keeps in
 * ~/.claude/projects.
 *
 * A response is logged once per piece of it (text, each tool call), every copy
 * with the same usage, so it is counted once by its message id and request id.
 * Counted twice, a day read about three times what it was.
 */

import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { add, type Counted } from './count.ts';

async function* transcripts(dir: string): AsyncGenerator<string> {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const e of entries) {
		const path = join(dir, e.name);
		if (e.isDirectory()) yield* transcripts(path);
		else if (e.name.endsWith('.jsonl')) yield path;
	}
}

export async function claudeCode(): Promise<Counted> {
	const root = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'projects');
	const days: Counted = new Map();
	const seen = new Set<string>();
	for await (const file of transcripts(root)) {
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

			add(days, entry.timestamp, entry.sessionId, m.model, {
				input: m.usage.input_tokens ?? 0,
				output: m.usage.output_tokens ?? 0,
				cache_write: m.usage.cache_creation_input_tokens ?? 0,
				cache_read: m.usage.cache_read_input_tokens ?? 0
			});
		}
	}
	return days;
}
