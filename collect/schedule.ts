/**
 * Reporting every hour, by whatever this system runs things on a clock with: a
 * launch agent on a Mac, a systemd timer on Linux (cron where there is no
 * systemd for the user), a scheduled task on Windows. Each runs this same
 * script, with this same node, by their full paths: a job started by the system
 * has none of the shell's PATH.
 */

import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const NAME = 'tokendash';
const LABEL = 'dev.tokendash.report';
const run = (cmd: string, args: string[], input?: string) => execFileSync(cmd, args, { input, stdio: ['pipe', 'pipe', 'pipe'] }).toString();

export async function schedule(script: string): Promise<string> {
	const node = process.execPath;
	if (process.platform === 'darwin') {
		const plist = join(homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`);
		await mkdir(join(plist, '..'), { recursive: true });
		await writeFile(
			plist,
			`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
	<key>Label</key><string>${LABEL}</string>
	<key>ProgramArguments</key><array><string>${node}</string><string>${script}</string><string>report</string><string>--quiet</string></array>
	<key>StartInterval</key><integer>3600</integer>
	<key>RunAtLoad</key><true/>
</dict></plist>
`
		);
		try {
			run('launchctl', ['bootout', `gui/${process.getuid!()}/${LABEL}`]);
		} catch {}
		run('launchctl', ['bootstrap', `gui/${process.getuid!()}`, plist]);
		return `a launch agent, every hour (${plist})`;
	}
	if (process.platform === 'win32') {
		run('schtasks', ['/Create', '/F', '/SC', 'HOURLY', '/TN', NAME, '/TR', `"${node}" "${script}" report --quiet`]);
		return 'a scheduled task, every hour ("tokendash" in Task Scheduler)';
	}
	try {
		const dir = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'systemd', 'user');
		await mkdir(dir, { recursive: true });
		await writeFile(join(dir, `${NAME}.service`), `[Unit]\nDescription=Report coding-tool usage to tokendash\n\n[Service]\nType=oneshot\nExecStart="${node}" "${script}" report --quiet\n`);
		// Persistent: an hour missed while the machine was off is run when it is back. The delay spreads everyone's
		// reports over the hour instead of all at :00.
		await writeFile(join(dir, `${NAME}.timer`), `[Unit]\nDescription=Report to tokendash every hour\n\n[Timer]\nOnCalendar=hourly\nPersistent=true\nRandomizedDelaySec=600\n\n[Install]\nWantedBy=timers.target\n`);
		run('systemctl', ['--user', 'daemon-reload']);
		run('systemctl', ['--user', 'enable', '--now', `${NAME}.timer`]);
		return `a systemd timer, every hour (${dir}/${NAME}.timer)`;
	} catch {
		const line = `${Math.floor(Math.random() * 60)} * * * * "${node}" "${script}" report --quiet # ${NAME}`;
		run('crontab', ['-'], [...crontab().filter((l) => !l.endsWith(`# ${NAME}`)), line, ''].join('\n'));
		return 'a line in your crontab, every hour';
	}
}

export async function unschedule(): Promise<string> {
	if (process.platform === 'darwin') {
		try {
			run('launchctl', ['bootout', `gui/${process.getuid!()}/${LABEL}`]);
		} catch {}
		await rm(join(homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`), { force: true });
		return 'the launch agent is gone';
	}
	if (process.platform === 'win32') {
		run('schtasks', ['/Delete', '/F', '/TN', NAME]);
		return 'the scheduled task is gone';
	}
	const said: string[] = [];
	try {
		run('systemctl', ['--user', 'disable', '--now', `${NAME}.timer`]);
		said.push('the systemd timer');
	} catch {}
	const dir = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'systemd', 'user');
	await rm(join(dir, `${NAME}.timer`), { force: true });
	await rm(join(dir, `${NAME}.service`), { force: true });
	const lines = crontab();
	if (lines.some((l) => l.endsWith(`# ${NAME}`))) {
		run('crontab', ['-'], [...lines.filter((l) => !l.endsWith(`# ${NAME}`)), ''].join('\n'));
		said.push('the crontab line');
	}
	return said.length ? `${said.join(' and ')} ${said.length > 1 ? 'are' : 'is'} gone` : 'nothing was scheduled';
}

function crontab(): string[] {
	try {
		return run('crontab', ['-l']).split('\n').filter(Boolean);
	} catch {
		return [];
	}
}
