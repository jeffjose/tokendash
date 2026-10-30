import { cubicOut } from 'svelte/easing';
import { slide } from 'svelte/transition';

/**
 * How a thing that opens in its place arrives: it grows down from the line
 * that opened it, and what is under it moves out of the way, where otherwise
 * it would jump. (`transition:grow`.) The other half of the app's motion, the
 * things that arrive over the page, is in `app.css`.
 *
 * Quick, and quicker to go; and not at all for anyone who has asked for less
 * motion.
 */
export function grow(node: Element, { duration = 170 }: { duration?: number } = {}) {
	const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	return slide(node, { duration: still ? 0 : duration, easing: cubicOut });
}
