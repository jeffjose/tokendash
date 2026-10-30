<script lang="ts">
	import { BTN_MAIN } from '#lib/styles.js';
</script>

<svelte:head>
	<title>tokendash</title>
</svelte:head>

<!-- One person for now; a list of people, and a way to join it, when there is a database to keep them in. -->
<main class="mx-auto flex min-h-svh max-w-md flex-col items-start justify-center gap-4 px-6">
	<h1 class="text-[22px] font-medium tracking-tight">tokendash</h1>
	<p class="text-[14px] leading-relaxed text-muted-foreground">What you have spent on Claude Code, a day at a time, on a page that is yours.</p>
	<a href="/jeffjose" class={BTN_MAIN}>jeffjose</a>
</main>
