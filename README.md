# tokendash

What you have spent on Claude Code, a day at a time, on a page that is yours:
`/<github-username>`. A GitHub username is the handle because it is already
one person's, and no one else can have it.

For now it is one person, read from a file. A database, and a way for others
to send theirs, come later.

```sh
pnpm install
pnpm collect jeffjose   # count this machine's Claude Code transcripts into static/data/jeffjose.json
pnpm dev                # http://localhost:5173/jeffjose
pnpm check
pnpm build
```

## Where the numbers come from

Claude Code writes every response it gets to a transcript in
`~/.claude/projects/`, with what it cost in tokens: read in, written out, and
put in or read back from the prompt cache. `collect/index.ts` adds those
up by day, tool and model. Only the counts are kept; no project names, paths or
words from a session.

Claude Code deletes a transcript a month or so after it was last used, so the
collector lays each run over the file the last one wrote and keeps the larger
of every count. Run it at least every few weeks (or on a schedule) and the
history only grows.

What it does not see: Claude Code on other machines, and claude.ai chats.

## The page

| Piece | Where |
|---|---|
| The page for a handle | `src/routes/[handle]/` |
| The kept file, added up the ways the page reads it | `src/lib/usage.ts` |
| A year of days, a square each | `src/lib/components/year.svelte` |
| The last 30 days, a bar each | `src/lib/components/month.svelte` |

It is built on [seed-web](https://github.com/jeffjose/seed-web): its type,
color and hints, without its app shell (the shell's pieces are still in
`src/lib/components/` for when there is something to work in). Why it looks
as it does is in [DESIGN.md](DESIGN.md).

## Credits

Icons are from [Solar](https://www.figma.com/community/file/1166831539721848736)
by 480 Design, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), redrawn
here with a heavier line. Colors are from [Radix Colors](https://www.radix-ui.com/colors).
