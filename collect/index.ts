/**
 * tokendash: what the coding tools on this machine have spent, by day, tool
 * and model, sent to your page. Only counts leave here: no project names, no
 * paths, no words from a session.
 *
 *   node collect/index.ts count [--print]   count this machine (and print the file it would send)
 *   node collect/index.ts setup <url>       where to send it: the address your page gave you
 *   node collect/index.ts report            count, and send
 *   node collect/index.ts schedule          report every hour, by this system's own clock
 *   node collect/index.ts unschedule
 *
 * Every machine you use sends its own file under its own id, and your page adds
 * them up: the same account on a laptop and a desktop is one page.
 */

import { config, count, DIR, save } from './machine.ts';
import { schedule, unschedule } from './schedule.ts';

const [cmd, ...args] = process.argv.slice(2);
const quiet = args.includes('--quiet');
const say = (s: string) => quiet || console.log(s);

if (cmd === 'count') {
	const { file, said } = await count();
	if (args.includes('--print')) process.stdout.write(JSON.stringify(file) + '\n');
	else say(`${said.join('\n')}\n${file.days.length} days kept for ${file.machine.name} (${DIR})`);
} else if (cmd === 'setup') {
	const url = args[0];
	if (!url || !/^https?:\/\//.test(url)) fail('usage: tokendash setup <the address your page gave you>');
	await save({ ...(await config()), url });
	say(`Reports from ${(await config()).name} go to ${url}`);
} else if (cmd === 'report') {
	const c = await config();
	if (!c.url) fail('Nowhere to send it yet: run `tokendash setup <url>` with the address your page gave you.');
	const { file } = await count();
	const res = await fetch(c.url!, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(file) }).catch((e) => fail(`Could not reach ${c.url}: ${e.message}`));
	if (!res.ok) fail(`${c.url} said ${res.status}: ${(await res.text()).slice(0, 300)}`);
	say(`Sent ${file.days.length} days from ${file.machine.name}`);
} else if (cmd === 'schedule') {
	if (!(await config()).url) fail('Nowhere to send it yet: run `tokendash setup <url>` first.');
	say(`Reporting every hour: ${await schedule(import.meta.filename)}`);
} else if (cmd === 'unschedule') {
	say(await unschedule());
} else {
	fail('usage: tokendash count [--print] | setup <url> | report | schedule | unschedule');
}

function fail(s: string): never {
	console.error(s);
	process.exit(1);
}
