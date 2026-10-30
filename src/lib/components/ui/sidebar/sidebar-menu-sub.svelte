<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLUListElement>> = $props();
</script>

<ul
	bind:this={ref}
	data-slot="sidebar-menu-sub"
	data-sidebar="menu-sub"
	class={cn("relative gap-px py-1 pl-7 pr-2 group-data-[collapsible=icon]:hidden flex min-w-0 flex-col", className)}
	{...restProps}
>
	<div class="absolute left-[18px] inset-y-1 w-px bg-sidebar-foreground/15"></div>
	{@render children?.()}
</ul>
