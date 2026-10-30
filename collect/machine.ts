/**
 * This machine: who it is, where it keeps what it counted, and the file it reports.
 *
 * A machine is known by an id it makes up the first time and keeps, not by its
 * name: two laptops can both be called "macbook", and one can be renamed. It
 * also makes a key the first time, and signs every file it reports with it, so
 * that what comes in under its id later is known to come from the same place.
 * A signature says who sent a file, not that the counts in it are true; what
 * is checked of the counts themselves is in `check.ts`.
 *
 * Everything is kept in one folder: the place a program's own settings go on
 * each system, or $TOKENDASH_HOME.
 */

import { createPrivateKey, createPublicKey, generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir, hostname } from 'node:os';
import { join } from 'node:path';
import { claudeCode } from './claude-code.ts';
import { codex } from './codex.ts';
import { KEYS, empty, zone, type Counted, type Day, type Spent, type Tokens } from './count.ts';
import { opencode } from './opencode.ts';
import { gemini } from './gemini.ts';
import { amp } from './amp.ts';
import { droid } from './droid.ts';

export const TOOLS: Record<string, () => Promise<Counted>> = { 'claude-code': claudeCode, codex, opencode, 'gemini-cli': gemini, amp, droid };

export const DIR =
	process.env.TOKENDASH_HOME ||
	(process.platform === 'win32'
		? join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'tokendash')
		: process.platform === 'darwin'
			? join(homedir(), 'Library', 'Application Support', 'tokendash')
			: join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'tokendash'));
const CONFIG = join(DIR, 'config.json');
const KEPT = join(DIR, 'machine.json');

export type Config = { id: string; name: string; key: string; url?: string };
export type MachineFile = {
	version: 1;
	machine: { id: string; name: string };
	zone: string;
	generated_at: string;
	/** The public half of the machine's key (SPKI, base64), so a file can be checked by itself. */
	key: string;
	days: Day[];
	/** Ed25519, over the file as JSON without this field. */
	sig: string;
};

export async function config(): Promise<Config> {
	try {
		return JSON.parse(await readFile(CONFIG, 'utf8'));
	} catch {}
	const { privateKey } = generateKeyPairSync('ed25519');
	const c: Config = { id: randomUUID(), name: hostname().replace(/\.local$/, ''), key: privateKey.export({ type: 'pkcs8', format: 'pem' }) as string };
	await save(c);
	return c;
}

export async function save(c: Config) {
	await mkdir(DIR, { recursive: true });
	await writeFile(CONFIG, JSON.stringify(c, null, '\t') + '\n');
	// The key is the machine's: no one else on it should read it.
	await chmod(CONFIG, 0o600).catch(() => {});
}

/** What a file is signed over: itself, as JSON, without its signature. */
export const signed = (f: Omit<MachineFile, 'sig'> & { sig?: string }) => {
	const { sig: _, ...body } = f;
	return Buffer.from(JSON.stringify(body));
};

/**
 * Counts every tool on this machine and lays it over what was kept from the last count, keeping the larger of
 * each count (the tools delete their records, and a day whose records are gone stays as it was counted while they
 * were there). `seed` is a file of days from before there was a machine file, laid under the rest once.
 */
export async function count(seed?: Day[]): Promise<{ file: MachineFile; said: string[] }> {
	const c = await config();
	const kept = new Map<string, Day>();
	for (const d of seed ?? []) kept.set(d.date, d);
	try {
		for (const d of (JSON.parse(await readFile(KEPT, 'utf8')) as MachineFile).days) kept.set(d.date, d);
	} catch {}

	const said: string[] = [];
	for (const [tool, counter] of Object.entries(TOOLS)) {
		const days = await counter();
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
			const hours = d.hours.map((n, h) => Math.max(old?.hours?.[h] ?? 0, n));
			day.tools[tool] = { sessions: Math.max(old?.sessions ?? 0, d.sessions.size), hours, models };
			kept.set(date, day);
		}
		said.push(`${tool}: ${days.size} days, ${responses} responses on disk`);
	}

	const key = createPublicKey(createPrivateKey(c.key)).export({ type: 'spki', format: 'der' }).toString('base64');
	const body: Omit<MachineFile, 'sig'> = {
		version: 1,
		machine: { id: c.id, name: c.name },
		zone,
		generated_at: new Date().toISOString(),
		key,
		days: [...kept.values()].sort((a, b) => a.date.localeCompare(b.date))
	};
	const file: MachineFile = { ...body, sig: sign(null, signed(body), createPrivateKey(c.key)).toString('base64') };
	await mkdir(DIR, { recursive: true });
	await writeFile(KEPT, JSON.stringify(file) + '\n');
	return { file, said };
}
