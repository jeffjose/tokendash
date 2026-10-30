import { goto } from '$app/navigation';
import { toast } from 'svelte-sonner';
import type { IconName } from '#lib/icons.js';
import type { Place } from '#lib/nav.js';

/**
 * What can be done to a thing: said once, as a list, so that the menu under
 * the right button and the one that drops from a button are the same menu
 * (`right-click.svelte`, `menu-list.svelte`).
 *
 * A menu for a kind of thing is a function here that is given the thing and
 * gives back its list. It is called when the menu is asked for, so the list
 * says how things stand then (what is ticked, what cannot be done).
 *
 * `dot` is a color shown in place of an icon; `checked` ticks the entry;
 * `danger` is for what throws something away; `sub` is a menu inside it.
 * `chips` are other ways of doing the same thing, at the row's right, each
 * one press (mark as read: only what is older than a day, a week).
 */
export type Entry =
	| 'line'
	| {
			label: string;
			icon?: IconName;
			/** A color, shown as a dot in place of an icon (a CSS color). */
			dot?: string;
			checked?: boolean;
			run?: () => unknown;
			danger?: boolean;
			disabled?: boolean;
			sub?: Entry[];
			chips?: { label: string; tip?: string; disabled?: boolean; run: () => unknown }[];
	  };

/** A place in the sidebar: go to it, here or in a tab of its own, or take its address. */
export function placeMenu(p: Place): Entry[] {
	return [
		{ label: 'Open', icon: p.icon, run: () => goto(p.href) },
		{ label: 'Open in new tab', icon: 'external-link', run: () => window.open(p.href, '_blank', 'noopener') },
		'line',
		{
			label: 'Copy link',
			icon: 'link',
			run: () =>
				navigator.clipboard.writeText(new URL(p.href, location.origin).href).then(
					() => toast('Link copied'),
					() => toast('That did not work')
				)
		}
	];
}
