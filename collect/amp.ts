/**
 * What Amp has spent on this machine, from the threads it keeps in
 * ~/.local/share/amp/threads (or $AMP_DATA_DIR), a .json a thread.
 *
 * Read as ccusage reads it (its Amp adapter), and not yet tried on a machine
 * with Amp on it. A thread with a usage ledger is counted from the ledger, an
 * event a response, with the cache counts of the message the event is for; one
 * without is counted from its assistant messages' own usage.
 */

import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { add, type Counted } from './count.ts';

async function* threads(dir: string): AsyncGenerator<string> {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const e of entries) {
		const path = join(dir, e.name);
		if (e.isDirectory()) yield* threads(path);
		else if (e.name.endsWith('.json')) yield path;
	}
}

const n = (v: unknown) => (typeof v === 'number' && v > 0 ? v : 0);

export async function amp(): Promise<Counted> {
	const roots = (process.env.AMP_DATA_DIR || join(homedir(), '.local', 'share', 'amp')).split(',');
	const days: Counted = new Map();
	for (const root of roots) {
		for await (const file of threads(join(root, 'threads'))) {
			let thread;
			try {
				thread = JSON.parse(await readFile(file, 'utf8'));
			} catch {
				continue;
			}
			const id: string | undefined = thread.id;
			const messages: any[] = Array.isArray(thread.messages) ? thread.messages : [];
			const events: any[] | undefined = Array.isArray(thread.usageLedger?.events) ? thread.usageLedger.events : undefined;
			if (events) {
				const cache = new Map<number, any>();
				for (const m of messages) if (m.role === 'assistant' && typeof m.messageId === 'number') cache.set(m.messageId, m.usage ?? {});
				for (const e of events) {
					if (!e.timestamp || !e.model || !e.tokens) continue;
					const c = cache.get(e.toMessageId) ?? {};
					let input = n(e.tokens.input);
					const output = n(e.tokens.output);
					// Only a total, and no parts: it is counted as read in, as ccusage does.
					if (!input && !output) input = n(e.tokens.total);
					if (!input && !output && !n(c.cacheCreationInputTokens) && !n(c.cacheReadInputTokens)) continue;
					add(days, e.timestamp, id, e.model, { input, output, cache_write: n(c.cacheCreationInputTokens), cache_read: n(c.cacheReadInputTokens) });
				}
				continue;
			}
			for (const m of messages) {
				const u = m.role === 'assistant' ? m.usage : null;
				if (!u?.timestamp || !u.model) continue;
				const parts = [u.inputTokens, u.outputTokens, u.cacheCreationInputTokens, u.cacheReadInputTokens].map(n);
				if (!parts.some(Boolean)) continue;
				add(days, u.timestamp, id, u.model, { input: parts[0], output: parts[1], cache_write: parts[2], cache_read: parts[3] });
			}
		}
	}
	return days;
}
