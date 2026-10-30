import { untrack } from 'svelte';
import { goto } from '$app/navigation';
import type { IconName } from '#lib/icons.js';
import { KEPT, fontOf, hrefOf, wear } from '#lib/fonts.js';

/** View state kept on this machine. Storage can be unavailable; nothing here depends on it. */
function recall(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}
function remember(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {}
}

/**
 * The sections of Settings, in the groups its list shows them in. The first is
 * the one Settings opens on, and the one whose address is plain `#settings`.
 */
export const SETTINGS_SECTIONS = [
	{ key: 'appearance', label: 'Appearance', icon: 'palette', group: 'App', words: 'theme look mode dark light' },
	{ key: 'shortcuts', label: 'Shortcuts', icon: 'keyboard', group: 'App', words: 'keyboard keys' },
	{ key: 'general', label: 'General', icon: 'sliders-horizontal', group: 'Example', words: 'options' },
	{ key: 'notifications', label: 'Notifications', icon: 'bell', group: 'Example', words: 'alerts sounds' }
] as const satisfies readonly { key: string; label: string; icon: IconName; group: string; words: string }[];
export const SETTINGS_GROUPS = ['App', 'Example'] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]['key'];
const FIRST: SettingsSection = SETTINGS_SECTIONS[0].key;

/** What is asked before something is thrown away: `action` does it, `other` (when given) is what to do instead. */
type Question = { title: string; body?: string; action: string; other?: string };
type Answer = 'yes' | 'other' | 'no';

/**
 * The pane toggles and everything else about the shell, module-level so it
 * survives navigation. The left rail keeps its own state inside shadcn's
 * sidebar context; this is the right one, Settings, the search, and the one
 * "are you sure".
 */
class UiState {
	/**
	 * Open at first run, and after that however you left it — a reload that
	 * puts back a pane you closed, or closes one you opened, is the app
	 * undoing you. The left one is remembered the same way, by the sidebar
	 * itself.
	 */
	#inspector = $state(recall('inspector:state') !== 'false');
	get inspector() {
		return this.#inspector;
	}
	set inspector(open: boolean) {
		this.#inspector = open;
		if (!open) this.inspectorWide = false;
		remember('inspector:state', String(open));
	}

	/** How wide the sidebar is, in pixels: dragged by its edge, and kept as it was left. */
	#sidebarWidth = $state(Number(recall('sidebar:width')) || 272);
	get sidebarWidth() {
		return this.#sidebarWidth;
	}
	set sidebarWidth(px: number) {
		this.#sidebarWidth = Math.round(px);
		remember('sidebar:width', String(this.#sidebarWidth));
	}

	/** How wide the right pane is, in pixels: dragged by its edge, and kept as it was left. */
	#inspectorWidth = $state(Number(recall('inspector:width')) || 336);
	get inspectorWidth() {
		return this.#inspectorWidth;
	}
	set inspectorWidth(px: number) {
		this.#inspectorWidth = Math.round(px);
		remember('inspector:width', String(this.#inspectorWidth));
	}

	/** The right pane has the whole middle to itself. Not remembered: it is for the moment. */
	inspectorWide = $state(false);

	/**
	 * The dock under the page: how tall it is when it is up, dragged by its top edge, and which of its parts is showing.
	 * Whether it is up is not remembered: it comes up when asked for and folds when you click away.
	 */
	#dockHeight = $state(Number(recall('dock:height')) || 288);
	get dockHeight() {
		return this.#dockHeight;
	}
	set dockHeight(px: number) {
		this.#dockHeight = Math.round(px);
		remember('dock:height', String(this.#dockHeight));
	}
	dockOpen = $state(false);
	#dockTab = $state(recall('dock:tab') ?? '');
	get dockTab() {
		return this.#dockTab;
	}
	set dockTab(tab: string) {
		this.#dockTab = tab;
		remember('dock:tab', tab);
	}

	/**
	 * Peeking at the folded sidebar: hover its button to float it over the
	 * page, click to pin. The sidebar owns the closing rule (distance, not
	 * mouseleave).
	 */
	peekLeft = $state(false);

	/**
	 * Settings, open over wherever you are, on one of its sections; null when
	 * shut. It is not a page, so it has no path of its own: it is the end of
	 * the address of whatever page it is over (`/one#settings`, or
	 * `#settings/shortcuts` for a section). The page under it stays put, Back
	 * shuts it, and the address opened fresh shows that page with it open.
	 */
	get settings(): SettingsSection | null {
		const [, on, s] = /^#(settings)(?:\/(.+))?$/.exec(this.hash) ?? [];
		if (!on) return null;
		return SETTINGS_SECTIONS.find((x) => x.key === s)?.key ?? FIRST;
	}
	set settings(to: SettingsSection | null) {
		const at = this.settings;
		if (to === at) return;
		const here = location.pathname + location.search;
		if (to) {
			const next = `#settings${to === FIRST ? '' : `/${to}`}`;
			// Only the end of the address changes: nothing is navigated to.
			if (at) void goto(here + next, { shallow: true, replace: true });
			else {
				this.settingsOver = true;
				void goto(here + next, { shallow: true });
			}
			this.hash = next;
		} else if (this.settingsOver) {
			// It was opened over this page here: go back to it as it was.
			this.settingsOver = false;
			history.back();
		} else {
			void goto(here, { shallow: true, replace: true });
			this.hash = '';
		}
	}
	/** Whether Settings was opened here, rather than arrived at by its address. */
	private settingsOver = false;
	/** The end of the address, followed as it changes (Back and Forward change it too). */
	private hash = $state(typeof location === 'undefined' ? '' : location.hash);
	constructor() {
		if (typeof window === 'undefined') return;
		const follow = () => {
			// Back, out of Settings, with something unsaved in it: Settings is
			// put back, and its bar says why.
			if (this.dirty && this.settings && !location.hash.startsWith('#settings')) {
				history.pushState(history.state, '', location.pathname + location.search + this.hash);
				this.stopped++;
				return;
			}
			this.hash = location.hash;
		};
		window.addEventListener('popstate', follow);
		window.addEventListener('hashchange', follow);
	}
	/**
	 * What in Settings has been changed and not saved, by section: each says
	 * how to keep its own and how to throw it away. Going from one section to
	 * another is free, since you may not be done; they are all saved or
	 * discarded together, from one bar. Closing does not happen until then:
	 * that bar already offers both, so there is no second thing to ask with.
	 * It is pointed at.
	 */
	unsaved = $state<Record<string, { save: () => unknown; discard: () => void }>>({});
	get dirty() {
		return Object.keys(this.unsaved).length > 0;
	}
	/** A section says it has something unsaved, or (null) that it no longer has. */
	pend(section: string, how: { save: () => unknown; discard: () => void } | null) {
		// Called from effects: what is already pending is not something they depend on.
		const { [section]: _, ...rest } = untrack(() => this.unsaved);
		if (!how && !_) return;
		this.unsaved = how ? { ...rest, [section]: how } : rest;
	}
	/** Counts up each time leaving was stopped by something unsaved: the bar says so. */
	stopped = $state(0);

	/** The search over everything (⌘K) is open. */
	palette = $state(false);

	/**
	 * A question that wants a yes before something is thrown away. One dialog
	 * for the whole app (`confirm-dialog.svelte`); the question stays put while
	 * the dialog is shutting, so the words do not vanish mid-fade.
	 */
	question = $state<Question | null>(null);
	confirming = $state(false);
	#answer: ((said: Answer) => void) | null = null;

	confirm(question: Omit<Question, 'other'>): Promise<boolean> {
		return this.choose(question).then((said) => said === 'yes');
	}

	/** The same question, with a second way out of it (`other`): the thing to do instead of throwing it away. */
	choose(question: Question): Promise<Answer> {
		this.#answer?.('no');
		this.question = question;
		this.confirming = true;
		return new Promise((resolve) => (this.#answer = resolve));
	}

	answer(said: Answer) {
		this.confirming = false;
		this.#answer?.(said);
		this.#answer = null;
	}
}

/**
 * Light or dark is one choice and the look is another. They were one list
 * once, with light looks and dark looks in it: choosing a look chose light or
 * dark with it, and System meant nothing once a look was on.
 */
export const MODES = [
	{ value: 'light', label: 'Light', icon: 'sun' },
	{ value: 'dark', label: 'Dark', icon: 'moon' },
	{ value: 'system', label: 'System', icon: 'monitor' }
] as const satisfies readonly { value: string; label: string; icon: IconName }[];
export type Mode = (typeof MODES)[number]['value'];

/** A look on one of its two pages, for showing the choice: the page, what is written on it, and the app's own color there. */
type Side = readonly [page: string, text: string, brand: string];
/** The app's own color where a look does not say one (`--brand` in `app.css`). */
const SAGE = { dark: '#b3c7a1', light: 'oklch(0.56 0.075 135)' } as const;

/**
 * The looks there are. The first is the app's own, which the stylesheet has
 * without being told which. The rest are each no more than a page color and a
 * text color, twice: for a dark page and for a light one (`app.css`, "Looks",
 * where the same colors are said to the stylesheet; they are here only for
 * showing the choice).
 *
 * Added to at the end: a list that is looked at does not change its order as
 * it grows.
 */
export const LOOKS = [
	{ value: 'own', label: 'Default', dark: ['#111113', '#eeeef0', SAGE.dark], light: ['#fafbfa', '#1c1f1c', SAGE.light] },
	{ value: 'paper', label: 'Paper', dark: ['#191713', '#e6dfd0', SAGE.dark], light: ['#f5efe3', '#2a251d', SAGE.light] },
	{ value: 'terminal', label: 'Terminal', dark: ['#060a06', '#b6efb6', SAGE.dark], light: ['#eef5ea', '#17381a', SAGE.light] },
	{ value: 'nord', label: 'Nord', dark: ['#2e3440', '#eceff4', '#88c0d0'], light: ['#eceff4', '#2e3440', '#4f6f98'] },
	{ value: 'solarized', label: 'Solarized', dark: ['#002b36', '#a5b3b3', '#2f9be0'], light: ['#fdf6e3', '#475b62', '#1f6fa8'] }
] as const satisfies readonly { value: string; label: string; dark: Side; light: Side }[];
export type Look = (typeof LOOKS)[number]['value'];
/** The app's own look, worn when no other is: the page says nothing of it. */
const OWN: Look = 'own';

type Wearing = { mode: Mode; look: Look };

/**
 * How the app looks on this machine: light or dark, in which look, and in
 * what face. Kept in this browser (it is about the screen in front of you)
 * and put back as soon as the app loads. `app.html` reads all of it before
 * the first paint, so there is no flash; this is the same choice, held where
 * the app can change it. Keep the two in step.
 *
 * (What was kept when there was one list, `theme`, is turned into a mode and
 * a look by `app.html`, which has run by the time this is read.)
 */
class Appearance {
	/** As the system has it, light or dark, until another is chosen. */
	mode = $state<Mode>('system');
	look = $state<Look>(OWN);
	/** Whether the page is dark just now, whatever was asked for: for drawing a look as it would be. */
	dark = $state(false);

	constructor() {
		this.mode = MODES.find((m) => m.value === recall('mode'))?.value ?? 'system';
		this.look = LOOKS.find((l) => l.value === recall('look'))?.value ?? OWN;
		if (typeof window === 'undefined') return;
		// Following the system means following it when it changes, too.
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.apply());
	}

	/**
	 * The face the app is set in (`fonts.ts`). Kept as soon as it is chosen: the whole app wears it at once. Its
	 * family and where it is fetched from are kept beside its name, for the page to be dressed in it before the app
	 * has come (`app.html`).
	 */
	font = $state<string>(fontOf(recall('font')).key);
	setFont(key: string) {
		const f = fontOf(key);
		this.font = f.key;
		remember('font', f.key);
		remember('font:family', f.key === KEPT ? '' : f.family);
		remember('font:href', hrefOf(f));
		wear(f);
	}

	/** What is being tried on in Settings before it is saved; null when nothing is. */
	private trying: Wearing | null = null;

	/** Put it on the page: light or dark, and which look. */
	apply() {
		if (typeof window === 'undefined') return;
		const { mode, look } = this.trying ?? this;
		// "System" is something asked for, never something the page is: what it comes to is worked out here.
		const dark = mode === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : mode === 'dark';
		// The class is set from what was just worked out, not from `this.dark` read back. This also runs as Settings
		// is taken down, and a state read then is as it was before: a light page tried on and thrown away stayed light.
		this.dark = dark;
		document.documentElement.classList.toggle('dark', dark);
		// A look says which it is, for the stylesheet to dress the page by; the app's own says nothing.
		if (look === OWN) delete document.documentElement.dataset.look;
		else document.documentElement.dataset.look = look;
	}

	/**
	 * Wear a mode and a look without keeping them: the whole app is the only
	 * honest picture of light against dark. `null` puts the saved ones back.
	 */
	try(wearing: Wearing | null) {
		this.trying = wearing;
		this.apply();
	}

	/** Keep a mode, a look, or both. */
	set({ mode = this.mode, look = this.look }: Partial<Wearing>) {
		this.mode = mode;
		this.look = look;
		remember('mode', mode);
		remember('look', look);
		this.apply();
	}
}

export const ui = new UiState();
export const appearance = new Appearance();
// What is saved goes on the page as the app loads.
appearance.apply();
