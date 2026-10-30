/**
 * Scrolling a box to a place, drawn by hand a frame at a time and not left to
 * the browser (`behavior: 'smooth'`). The browser's own decides once where it
 * is going and how fast, and here neither holds: cards are still coming onto
 * the page and changing height while it moves, so it arrived somewhere that
 * was no longer the place, and had to be put right with a jump at the end.
 *
 * This one asks where the place is on every frame (`to`), so it lands on it
 * whatever moved meanwhile.
 *
 * It moves as a thing on a spring does, and not along a curve of a set
 * length: from standing still it gathers way, and it settles into the place
 * without running past it (it is stopped on the place as it reaches it).
 * It was a curve once, a third of a second long and nearly all of it
 * spent in the first tenth: the page leapt and then crept, which read as
 * frantic. A spring has no leap in it, and since it is pulled toward wherever
 * the place now is, a place that moves under it is followed and not chased.
 *
 * `to` gives the `scrollTop` wanted, or null to call it off (the box was
 * moved by hand, or something else was gone to). The promise is of whether it
 * got there.
 */

/**
 * The spring: how hard it pulls, how much it is held back, and how heavy what it moves is. A little less held back
 * than would stop it dead at the place (it would run past by a hair), and it is stopped at the place as it reaches
 * it: so it gets there in a little over half a second and is there, with no slow creep over the last few pixels,
 * which is what made the first spring here feel soft at the end.
 *
 * To try another by hand: `localStorage.setItem('glide:spring', '200,35,2')` (pull, hold, weight), and jump again.
 */
const SPRING = [200, 35, 2];
function spring(): number[] {
	try {
		const tried = (localStorage.getItem('glide:spring') ?? '').split(',').map(Number);
		if (tried.length === 3 && tried.every((n) => Number.isFinite(n) && n > 0)) return tried;
	} catch {}
	return SPRING;
}
/** And no longer than this, come what may: a place that keeps moving away is given up on gracefully, by being gone to. */
const LONGEST = 1400;

/**
 * `within` is the furthest it is ever let be from the place, in px (a viewport, say). The place moves away
 * while it is being gone to (rows arriving above the foot of a list push the foot down), and a spring that only
 * follows would then be seen to run through two or three screens of things. Held to within one, what goes by is
 * one screen's worth and no more, however far the place gets: it is put closer, at the speed it had.
 */
export function glide(box: HTMLElement, to: () => number | null, within = Infinity): Promise<boolean> {
	const most = () => box.scrollHeight - box.clientHeight;
	const aim = () => {
		const want = to();
		return want === null ? null : Math.max(0, Math.min(most(), want));
	};
	return new Promise((done) => {
		// For whoever has asked for less movement: there at once.
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			const want = aim();
			if (want === null) return done(false);
			box.scrollTop = want;
			return done(true);
		}
		const t0 = performance.now();
		const [pull, hold, weight] = spring();
		// (Where it is, kept here to a fraction of a pixel: the box itself rounds what it is given, and would lose the slow end of the movement.)
		let [at, speed, last] = [box.scrollTop, 0, t0];
		const step = (now: number) => {
			const want = aim();
			if (want === null) return done(false);
			if (Math.abs(want - at) > within) at = want - Math.sign(want - at) * within;
			// (A frame that came late is not made up for in one stride: the spring is walked in short steps, which keeps it steady.)
			let dt = Math.min(64, now - last) / 1000;
			last = now;
			const side = Math.sign(want - at);
			for (; dt > 0; dt -= 0.004) {
				const h = Math.min(0.004, dt);
				speed += ((pull * (want - at) - hold * speed) / weight) * h;
				at += speed * h;
			}
			// There when it has reached the place (or gone a hair past it: it is stopped on it), or is as good as still beside it.
			const there = Math.sign(want - at) !== side || (Math.abs(want - at) < 0.5 && Math.abs(speed) < 8) || now - t0 > LONGEST;
			box.scrollTop = there ? want : at;
			if (there) done(true);
			else requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	});
}
