/**
 * What OpenCode has spent on this machine, from the database it keeps in
 * ~/.local/share/opencode. Each of its replies is a row in `message` with what
 * it cost; only the counts and the model's id are read out of it.
 *
 * OpenCode can run any maker's model (Opus as well as its own free ones), so
 * the model is kept by its own id and the page says who made it. Its reasoning
 * is counted beside the output, not in it, and is added to it here, as the
 * other tools count it.
 */

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { add, type Counted } from './count.ts';

export async function opencode(): Promise<Counted> {
	const file = join(process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share'), 'opencode', 'opencode.db');
	const days: Counted = new Map();
	if (!existsSync(file)) return days;
	const db = new DatabaseSync(file, { readOnly: true });
	const rows = db
		.prepare(
			`select session_id, time_created, json_extract(data, '$.modelID') as model, json_extract(data, '$.tokens') as tokens
			 from message where json_extract(data, '$.role') = 'assistant'`
		)
		.all() as { session_id: string; time_created: number; model: string | null; tokens: string | null }[];
	db.close();
	for (const r of rows) {
		const n = r.tokens ? JSON.parse(r.tokens) : null;
		// A reply that was cut off before it began has no tokens, and is not one.
		if (!r.model || !n || !(n.total ?? n.input + n.output)) continue;
		const t = add(days, r.time_created, r.session_id, r.model);
		t.input += n.input ?? 0;
		t.output += (n.output ?? 0) + (n.reasoning ?? 0);
		t.cache_write += n.cache?.write ?? 0;
		t.cache_read += n.cache?.read ?? 0;
	}
	return days;
}
