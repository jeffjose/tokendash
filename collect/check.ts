/**
 * What is checked of a machine's file before it is counted on someone's page.
 *
 * Nothing here can prove the counts are true: the collector runs on the
 * person's own machine, and anyone can write a file by hand. What can be done
 * is to make a made-up file hard to tell from nothing and easy to tell from a
 * real one:
 *
 * - The signature must be good, and the key the one the machine first came
 *   with (trust on first use, kept by whoever merges). Someone else cannot
 *   send under your machine, and a machine cannot change hands quietly.
 * - The counts must be ones a tool could have written: no day after tomorrow,
 *   no more responses in an hour than one a second, no response bigger than a
 *   model's window, and the hours adding up to no more than the day.
 *
 * A file that fails is not counted, and says why.
 */

import { createPublicKey, verify } from 'node:crypto';
import { BY_SESSION } from './count.ts';
import { signed, type MachineFile } from './machine.ts';

/** The most a single response can be: a million-token window read in, and what a model can write in one. */
const MOST_IN = 1_100_000;
const MOST_OUT = 200_000;

export function problems(f: MachineFile, known?: string): string[] {
	const out: string[] = [];
	if (f.version !== 1) return [`a version this does not read (${f.version})`];
	if (known && known !== f.key) out.push('signed with a different key than this machine first had');
	try {
		const key = createPublicKey({ key: Buffer.from(f.key, 'base64'), format: 'der', type: 'spki' });
		if (!verify(null, signed(f), key, Buffer.from(f.sig, 'base64'))) out.push('the signature does not match');
	} catch {
		out.push('the signature cannot be read');
	}
	const tomorrow = new Date(Date.now() + 2 * 86400e3).toISOString().slice(0, 10);
	for (const d of f.days) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || d.date > tomorrow) out.push(`${d.date}: not a day that has been`);
		for (const [tool, t] of Object.entries(d.tools)) {
			const where = `${d.date} ${tool}`;
			let messages = 0;
			let tokens = 0;
			for (const [model, n] of Object.entries(t.models)) {
				const vals = [n.input, n.output, n.cache_write, n.cache_read, n.messages];
				if (vals.some((v) => !Number.isSafeInteger(v) || v < 0)) out.push(`${where} ${model}: a count that is not a count`);
				if (n.messages === 0 && vals.some((v) => v > 0)) out.push(`${where} ${model}: tokens with no responses`);
				if (!BY_SESSION.has(tool) && n.output > n.messages * MOST_OUT) out.push(`${where} ${model}: more written out than a response can be`);
				if (!BY_SESSION.has(tool) && n.input + n.cache_write + n.cache_read > n.messages * MOST_IN) out.push(`${where} ${model}: more read in than a response can be`);
				messages += n.messages;
				tokens += n.input + n.output + n.cache_write + n.cache_read;
			}
			if (t.hours) {
				if (t.hours.length !== 24) out.push(`${where}: not 24 hours`);
				if (t.hours.some((h) => h > 3600)) out.push(`${where}: more than a response a second`);
				if (t.hours.reduce((a, b) => a + b, 0) > messages) out.push(`${where}: more responses by the hour than in the day`);
			}
			if (t.hour_tokens) {
				if (t.hour_tokens.length !== 24 || t.hour_tokens.some((h) => !Number.isSafeInteger(h) || h < 0)) out.push(`${where}: not 24 hours of tokens`);
				if (t.hour_tokens.reduce((a, b) => a + b, 0) > tokens) out.push(`${where}: more tokens by the hour than in the day`);
			}
			if (t.sessions > messages) out.push(`${where}: more sessions than responses`);
		}
	}
	return out;
}
