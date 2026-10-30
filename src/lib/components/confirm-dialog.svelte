<script lang="ts">
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { ui } from '#lib/ui.svelte.js';

	/**
	 * The app's one "are you sure": asked with `ui.confirm(...)`, answered here.
	 * Escape and Cancel are a no; nothing outside it can be clicked.
	 */
</script>

<AlertDialog.Root open={ui.confirming} onOpenChange={(open) => !open && ui.answer('no')}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{ui.question?.title}</AlertDialog.Title>
			{#if ui.question?.body}
				<AlertDialog.Description>{ui.question.body}</AlertDialog.Description>
			{/if}
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<!-- Throwing it away, and after it, when there is such a thing, what
			     to do instead (save it, keep it): the safe answer is the last. -->
			<AlertDialog.Action class={ui.question?.other ? 'danger' : 'danger-solid'} variant={ui.question?.other ? 'outline' : 'default'} onclick={() => ui.answer('yes')}>
				{ui.question?.action}
			</AlertDialog.Action>
			{#if ui.question?.other}
				<AlertDialog.Action onclick={() => ui.answer('other')}>{ui.question.other}</AlertDialog.Action>
			{/if}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
