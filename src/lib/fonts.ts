/**
 * The faces the app can be set in. Geist is the one it comes with, and is kept with the app; the rest are
 * fetched from Google Fonts when one is chosen (`google`: the family and weights, as its address has them), so
 * choosing one of those means the browser asks Google for it each time the app comes up. Where it cannot be
 * had (no network), the app is in Geist, as before.
 *
 * Regular, medium and semibold are what the app is set in; a face without a semibold is asked for its bold.
 *
 * A few, to show the ways one can be had. A new face is a line here; if it wants its own weights or spacing,
 * say so in `app.css` under `html[data-font='KEY']`, as Google Sans Flex does.
 */
export type Font = { key: string; label: string; family: string; google: string | null };

export const FONTS: Font[] = [
	{ key: 'geist', label: 'Geist', family: "'Geist Variable'", google: null },
	// (All of its weights and its optical sizes, as one face that varies: the weights it is set in are between the usual ones, `app.css`.)
	{ key: 'google-sans-flex', label: 'Google Sans Flex', family: "'Google Sans Flex'", google: 'Google+Sans+Flex:opsz,wght@8..144,300..700' },
	{ key: 'inter', label: 'Inter', family: "'Inter'", google: 'Inter:wght@400;500;600' },
	{ key: 'ibm-plex-sans', label: 'IBM Plex Sans', family: "'IBM Plex Sans'", google: 'IBM+Plex+Sans:wght@400;500;600' },
	{ key: 'atkinson', label: 'Atkinson Hyperlegible', family: "'Atkinson Hyperlegible Next'", google: 'Atkinson+Hyperlegible+Next:wght@400;500;600' },
	{ key: 'system', label: 'System', family: 'system-ui', google: null }
];
export const FONT = FONTS[0];
/** The one face kept with the app, and so there with no network: the page is in it unless another is chosen, and where another cannot be had. */
export const KEPT = 'geist';
export const fontOf = (key: string | null | undefined) => FONTS.find((f) => f.key === key) ?? FONT;
/** Where a face is fetched from; nothing for one that is not fetched. */
export const hrefOf = (f: Font) => (f.google ? `https://fonts.googleapis.com/css2?family=${f.google}&display=swap` : '');

/** Set the page in a face: fetched if it has to be, and named where the page's styles look for it (`--app-font`, in `app.css`). */
export function wear(f: Font) {
	if (typeof document === 'undefined') return;
	const href = hrefOf(f);
	let link = document.getElementById('app-font') as HTMLLinkElement | null;
	if (href) {
		if (!link) {
			link = Object.assign(document.createElement('link'), { id: 'app-font', rel: 'stylesheet' });
			document.head.appendChild(link);
		}
		if (link.href !== href) link.href = href;
	} else link?.remove();
	// (Said on the page which it is, for what is set differently in one face: its weights, how its letters are spaced.)
	document.documentElement.dataset.font = f.key;
	if (f.key === KEPT) document.documentElement.style.removeProperty('--app-font');
	else document.documentElement.style.setProperty('--app-font', f.family);
}
