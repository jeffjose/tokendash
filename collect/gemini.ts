/**
 * What Gemini CLI has spent on this machine, from the chats it keeps in
 * ~/.gemini/tmp/<project>/chats (or $GEMINI_DATA_DIR): a .json a chat with its
 * messages in it, or a .jsonl a message a line.
 *
 * A response is a message of type "gemini" with its tokens. The same chat can
 * be kept twice (a checkpoint, a resume), so a response is counted once by its
 * id; in a .jsonl a later line with the same id is the same response, written
 * again when it finished, and is the one kept.
 *
 * Gemini counts the cached part of the input inside the input, as OpenAI does;
 * it is taken out here so that "read in" means what it does for Anthropic. Its
 * thinking is beside the output and is added to it, and what tools put in is
 * read in. (As ccusage reads it.)
 */

import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { add, type Counted } from './count.ts';

type Message = { id?: string; type?: string; model?: string; timestamp?: string; tokens?: Record<string, number> };

async function* chats(dir: string): AsyncGenerator<string> {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const e of entries) {
		const path = join(dir, e.name);
		if (e.isDirectory()) yield* chats(path);
		else if (/\.jsonl?$/.test(e.name) && dir.endsWith('chats')) yield path;
	}
}

export async function gemini(): Promise<Counted> {
	const roots = (process.env.GEMINI_DATA_DIR || join(homedir(), '.gemini', 'tmp')).split(',');
	const days: Counted = new Map();
	const responses = new Map<string, Message & { session?: string }>();
	for (const root of roots) {
		for await (const file of chats(root)) {
			let text;
			try {
				text = await readFile(file, 'utf8');
			} catch {
				continue;
			}
			let session: string | undefined;
			let messages: Message[] = [];
			if (file.endsWith('.jsonl')) {
				for (const line of text.split('\n')) {
					try {
						const m = JSON.parse(line);
						session = m.sessionId ?? m.session_id ?? session;
						messages.push(m);
					} catch {}
				}
			} else {
				try {
					const chat = JSON.parse(text);
					session = chat.sessionId;
					messages = chat.messages ?? [];
				} catch {
					continue;
				}
			}
			for (const m of messages) {
				if (m.type !== 'gemini' || !m.tokens || !m.timestamp || !m.model) continue;
				responses.set(m.id ?? `${file}:${m.timestamp}`, { ...m, session });
			}
		}
	}
	for (const m of responses.values()) {
		const n = m.tokens!;
		const cached = n.cached ?? 0;
		if (!(n.total ?? (n.input ?? 0) + (n.output ?? 0))) continue;
		const t = add(days, m.timestamp!, m.session, m.model!);
		t.input += Math.max(0, (n.input ?? 0) - cached) + (n.tool ?? 0);
		t.output += (n.output ?? 0) + (n.thoughts ?? 0);
		t.cache_read += cached;
	}
	return days;
}
