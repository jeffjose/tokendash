import { error } from '@sveltejs/kit';
import { read } from '#lib/usage.js';

// The handle is a GitHub username, which is what makes it one person's: two people cannot have the same one.
const HANDLE = /^[a-z\d](?:[a-z\d-]{0,38})$/i;

export async function load({ params, fetch }) {
	if (!HANDLE.test(params.handle)) error(404, 'No one by that name');
	const res = await fetch(`/data/${params.handle.toLowerCase()}.json`);
	if (!res.ok) error(404, 'No one by that name');
	return { usage: read(await res.json()) };
}
