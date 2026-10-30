/**
 * What each model costs at its maker's API prices, for the page to say what the tokens would have cost bought one
 * at a time. From LiteLLM's list (the one ccusage reads), kept to the makers' own APIs, and written to
 * src/lib/prices.json with the commit it came from:
 *
 *   node collect/prices.ts
 *
 * Kept in the repo and not fetched by the page: a price that changes under a page that was not changed is a page
 * that says two things on two days. Run it again to take new prices.
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const REPO = 'BerriAI/litellm';
const PATH = 'model_prices_and_context_window.json';
/** The makers' own APIs, by LiteLLM's name for them: a model resold elsewhere is priced as its maker sells it. */
const SOLD_BY = ['anthropic', 'openai', 'gemini', 'deepseek', 'mistral', 'xai', 'moonshot'];

const commit = await (await fetch(`https://api.github.com/repos/${REPO}/commits?path=${PATH}&per_page=1`)).json();
const sha: string = commit[0].sha;
const list: Record<string, any> = await (await fetch(`https://raw.githubusercontent.com/${REPO}/${sha}/${PATH}`)).json();

// Per million tokens, in dollars: what a price is said in, and short enough to read in the file.
const per = (n: unknown) => (typeof n === 'number' ? Math.round(n * 1e6 * 1e6) / 1e6 : null);
const models: Record<string, { input: number; output: number; cache_write: number | null; cache_read: number | null }> = {};
for (const [id, p] of Object.entries(list)) {
	if (!SOLD_BY.includes(p.litellm_provider) || !['chat', 'responses'].includes(p.mode)) continue;
	const input = per(p.input_cost_per_token);
	const output = per(p.output_cost_per_token);
	if (input === null || output === null) continue;
	// Under the bare id ("gemini-3.7-flash", not "gemini/gemini-3.7-flash"), as the tools write it.
	const key = id.replace(/^[a-z_]+\//, '');
	models[key] ??= { input, output, cache_write: per(p.cache_creation_input_token_cost), cache_read: per(p.cache_read_input_token_cost) };
}

const out = {
	source: `https://github.com/${REPO}/blob/${sha}/${PATH}`,
	as_of: commit[0].commit.committer.date,
	per: 'million tokens, USD',
	models: Object.fromEntries(Object.entries(models).sort(([a], [b]) => a.localeCompare(b)))
};
await writeFile(join(import.meta.dirname, '..', 'src', 'lib', 'prices.json'), JSON.stringify(out, null, '\t') + '\n');
console.log(`${Object.keys(models).length} models, as of ${out.as_of} -> src/lib/prices.json`);
