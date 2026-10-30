# tokendash

What you have spent on Claude Code, Codex, OpenCode, Gemini CLI and more, a day at a time, on a
page that is yours: `/<github-username>`. A GitHub username is the handle
because it is already one person's, and no one else can have it.

For now it is one person, read from a file. A server that takes the reports,
and a way for others to sign up, come later; the collector that will send
them is here.

```sh
pnpm install
pnpm collect jeffjose        # count this machine into static/data/jeffjose.json
pnpm pull skyfall jeffjose   # and another machine's, over ssh
pnpm dev                     # http://localhost:5173/jeffjose
pnpm check
pnpm build
```

## The collector

`collect/index.ts` is what each person runs, on each machine they use. It
needs Node 22.5 or later and nothing else.

```sh
node collect/index.ts count [--print]   # count this machine (and print the file it would send)
node collect/index.ts setup <url>       # where to send it: https://…/r/<your id>
node collect/index.ts report            # count, and send
node collect/index.ts schedule          # report every hour
node collect/index.ts unschedule
```

`schedule` uses what the system has: a launch agent on macOS, a systemd user
timer on Linux (a crontab line where there is none), a scheduled task on
Windows. Each runs the same node and script by their full paths.

A machine makes an id and an Ed25519 key the first time, and keeps them, with
what it has counted, in its settings folder (`~/.config/tokendash`,
`~/Library/Application Support/tokendash`, `%APPDATA%\tokendash`, or
`$TOKENDASH_HOME`). What it sends is one file: its id and name, its time zone,
its days, its public key, and a signature over all of it.

### More than one machine

Every machine sends its own file under its own id, and a page is those files
side by side: their counts add up, and the page can split by machine. Within
one machine a run keeps the larger of each count (below); across machines they
are added, since two machines never see the same response.

`collect/local.ts` does by hand what the server will do: it puts each
machine's file in `data/<username>/`, checks it (`collect/check.ts`), and
writes the page's file from the ones that pass. `pnpm pull <host>` copies the
collector to another machine over ssh, runs it there, and brings back what it
would have sent.

### What is checked

Nothing can prove the counts are true: the collector runs on the person's own
machine, and anyone can write a file by hand. So the checks make a made-up file
hard to pass off, not impossible:

- **The signature**, against the key the machine first came with (kept in
  `data/<username>/keys.json`). No one else can send under your machine, and an
  edit to a file after it was signed is caught. You can still sign a file you
  made up yourself, on your own machine.
- **Counts a tool could have written:** no day that has not happened yet, no
  response bigger than a model's window, no more than one a second in an hour,
  the hours adding up to the day, no more sessions than responses.

What a server adds later: only the address with your id in it takes reports for
your page; a day more than a month old cannot grow (the tools have deleted the
records it could have been counted from); and the page says the numbers are
reported by you.

## Where the numbers come from

Each coding tool keeps a record of what every response cost in tokens: read
in, written out, and put in or read back from the prompt cache.
The collector adds them up by day, tool and model, with how many
responses came in each hour of the day. Only the counts are kept; no project
names, paths or words from a session.

| Tool | What is read | |
|---|---|---|
| Claude Code | `~/.claude/projects/**/*.jsonl` | `collect/claude-code.ts` |
| Codex | `~/.codex/sessions/**/*.jsonl` | `collect/codex.ts` |
| OpenCode | `~/.local/share/opencode/opencode.db` | `collect/opencode.ts` |
| Gemini CLI | `~/.gemini/tmp/*/chats/*.json[l]` | `collect/gemini.ts` |
| Amp | `~/.local/share/amp/threads/**/*.json` | `collect/amp.ts` (from ccusage's reading; not yet tried on real threads) |
| Droid | `~/.factory/sessions/**/*.settings.json` | `collect/droid.ts` (likewise; a session is counted whole, on one day) |

Cursor keeps no token counts on the machine (they are on its servers), so there is
nothing to collect it from yet; GitHub Copilot CLI's session snapshots need
ccusage's resume-by-resume reading, and are next. Both have their names and
marks on the page already.

A model is kept by its own id, and the page says who made it: OpenCode can run
Opus as well as its own models.

The tools delete their records after a while (Claude Code a month or so after
a transcript was last used), so the collector lays each run over the file the
last one wrote and keeps the larger of every count. Run it at least every few
weeks (or on a schedule) and the history only grows.

What it does not see: claude.ai chats, and machines it was not run on.
## The page

| Piece | Where |
|---|---|
| The page for a handle | `src/routes/[handle]/` |
| The kept file, added up the ways the page reads it | `src/lib/usage.ts` |
| A year of days, a square each | `src/lib/components/year.svelte` |
| Bars stacked by tool, maker or model (days, hours, weekdays) | `src/lib/components/bars.svelte`, `src/lib/split.ts` |
| The week hour by hour | `src/lib/components/clock.svelte` |
| What a mark is made of, under the pointer | `src/lib/components/hover.svelte`, `breakdown.svelte` |
| The marks of the tools and makers | `src/lib/marks.ts`, `src/lib/components/mark.svelte` |
| What the tokens would have cost at API prices (`pnpm prices` takes new ones) | `src/lib/prices.json`, `collect/prices.ts` |

It is built on [seed-web](https://github.com/jeffjose/seed-web): its type,
color and hints, without its app shell (the shell's pieces are still in
`src/lib/components/` for when there is something to work in). Why it looks
as it does is in [DESIGN.md](DESIGN.md).

## Credits

Icons are from [Solar](https://www.figma.com/community/file/1166831539721848736)
by 480 Design, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), redrawn
here with a heavier line. The marks of the tools and makers are from
[Simple Icons](https://simpleicons.org) (CC0), except Codex's, drawn here.
Colors are from [Radix Colors](https://www.radix-ui.com/colors).
