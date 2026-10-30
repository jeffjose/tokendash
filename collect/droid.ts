/**
 * What Droid (Factory) has spent on this machine, from the settings file it
 * keeps beside each session in ~/.factory/sessions (or $DROID_SESSIONS_DIR):
 * <session>.settings.json, with the session's tokens added up so far.
 *
 * Read as ccusage reads it (its Droid adapter), and not yet tried on a machine
 * with sessions in it. A session's tokens are one total, so the whole session
 * is counted on one day: the day its model was chosen (`providerLockTimestamp`),
 * or the day the file was last written. Its thinking is added to the output. The
 * same session kept twice (an archive) is the copy written last.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { add, type Counted } from './count.ts';

async function* settings(dir: string): AsyncGenerator<string> {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const e of entries) {
		const path = join(dir, e.name);
		if (e.isDirectory()) yield* settings(path);
		else if (e.name.endsWith('.settings.json')) yield path;
	}
}

const n = (v: unknown) => (typeof v === 'number' && v > 0 ? v : 0);

export async function droid(): Promise<Counted> {
	const roots = (process.env.DROID_SESSIONS_DIR || join(homedir(), '.factory', 'sessions')).split(',');
	const latest = new Map<string, { when: Date; model: string; u: any }>();
	for (const root of roots) {
		for await (const file of settings(root)) {
			let s;
			try {
				s = JSON.parse(await readFile(file, 'utf8'));
			} catch {
				continue;
			}
			const u = s?.tokenUsage;
			if (!u) continue;
			const written = (await stat(file)).mtime;
			const when = s.providerLockTimestamp ? new Date(s.providerLockTimestamp) : written;
			// A model chosen by name in Droid's own words ("custom:claude-opus-4-5") is said by the name.
			const model = String(s.model ?? 'unknown').replace(/^custom:/, '');
			const id = basename(file, '.settings.json');
			const was = latest.get(id);
			if (!was || written > was.when) latest.set(id, { when: isNaN(+when) ? written : when, model, u });
		}
	}
	const days: Counted = new Map();
	for (const [id, { when, model, u }] of latest) {
		let input = n(u.inputTokens);
		const output = n(u.outputTokens) + n(u.thinkingTokens);
		if (!input && !output) input = n(u.totalTokens);
		if (!input && !output && !n(u.cacheCreationTokens) && !n(u.cacheReadTokens)) continue;
		const t = add(days, when, id, model);
		t.input += input;
		t.output += output;
		t.cache_write += n(u.cacheCreationTokens);
		t.cache_read += n(u.cacheReadTokens);
	}
	return days;
}
