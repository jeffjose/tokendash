/**
 * A page from machine files, with no server: what an upload will do, done by hand for now.
 *
 *   node collect/local.ts <github-username> [machine files...]
 *
 * Counts this machine, puts its file beside any others in data/<username>/
 * (one a machine, by its id; the files given are copied in too), checks each,
 * and writes the page's file, static/data/<username>.json, from the ones that
 * pass. The key each machine first came with is kept in data/<username>/keys.json.
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { problems } from './check.ts';
import type { Day } from './count.ts';
import { count, type MachineFile } from './machine.ts';

const [handle, ...given] = process.argv.slice(2);
if (!handle || !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(handle)) {
	console.error('usage: node collect/local.ts <github-username> [machine files...]');
	process.exit(1);
}
const ROOT = join(import.meta.dirname, '..');
const DIR = join(ROOT, 'data', handle.toLowerCase());
const PAGE = join(ROOT, 'static', 'data', `${handle.toLowerCase()}.json`);
await mkdir(DIR, { recursive: true });

// The page's file from before there were machine files had the days at its top, all this machine's: they are laid
// under this machine's count once, so the history they hold is not lost.
let seed: Day[] | undefined;
try {
	const old = JSON.parse(await readFile(PAGE, 'utf8'));
	if (Array.isArray(old.days)) seed = old.days.map((d: any) => (d.tools ? d : { date: d.date, tools: { 'claude-code': { sessions: d.sessions, models: d.models } } }));
} catch {}

const { file, said } = await count(seed);
console.log(said.join('\n'));
await writeFile(join(DIR, `${file.machine.id}.json`), JSON.stringify(file) + '\n');
for (const path of given) {
	const f: MachineFile = JSON.parse(await readFile(path, 'utf8'));
	await writeFile(join(DIR, `${f.machine.id}.json`), JSON.stringify(f) + '\n');
}

const keysFile = join(DIR, 'keys.json');
const keys: Record<string, string> = JSON.parse(await readFile(keysFile, 'utf8').catch(() => '{}'));
const machines: MachineFile[] = [];
for (const name of await readdir(DIR)) {
	if (!name.endsWith('.json') || name === 'keys.json') continue;
	const f: MachineFile = JSON.parse(await readFile(join(DIR, name), 'utf8'));
	const wrong = problems(f, keys[f.machine.id]);
	if (wrong.length) {
		console.log(`${f.machine.name} (${f.machine.id}) is not counted:\n  ${wrong.slice(0, 10).join('\n  ')}`);
		continue;
	}
	keys[f.machine.id] ??= f.key;
	machines.push(f);
	console.log(`${f.machine.name}: ${f.days.length} days, counted ${f.generated_at}`);
}
await writeFile(keysFile, JSON.stringify(keys, null, '\t') + '\n');

// The page's file is the machines' files as they came, less what only checking needs.
machines.sort((a, b) => b.generated_at.localeCompare(a.generated_at));
const page = {
	handle,
	generated_at: machines[0]?.generated_at ?? new Date().toISOString(),
	machines: machines.map(({ machine, zone, generated_at, days }) => ({ machine, zone, generated_at, days }))
};
await mkdir(join(PAGE, '..'), { recursive: true });
await writeFile(PAGE, JSON.stringify(page) + '\n');
console.log(`${machines.length} ${machines.length === 1 ? 'machine' : 'machines'} -> static/data/${handle.toLowerCase()}.json`);
