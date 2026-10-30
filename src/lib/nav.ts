import type { IconName } from '#lib/icons.js';

/**
 * The places in the app, said once: the sidebar lists them, the search over
 * everything (⌘K) goes to them, and a page takes its name and icon from here.
 */
export type Place = { href: string; label: string; icon: IconName; words?: string };

/** Making something new: an action more than a place, and first in the sidebar. */
export const ACTION: Place = { href: '/new', label: 'New', icon: 'plus', words: 'create add make' };

export const PLACES: Place[] = [
	{ href: '/', label: 'Home', icon: 'house', words: 'start' },
	{ href: '/one', label: 'Page one', icon: 'file' },
	{ href: '/two', label: 'Page two', icon: 'file' }
];

/** Whether an address is this place: Home is Home and only Home, the others are themselves and what is under them. */
export const isAt = (place: Place, pathname: string) =>
	place.href === '/' ? pathname === '/' : pathname === place.href || pathname.startsWith(place.href + '/');
