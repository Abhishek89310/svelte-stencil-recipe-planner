<script lang="ts">
	import { toasts } from '$lib/state/toasts.svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
</script>

<!--
	Live region for transient feedback. `aria-live="polite"` means a screen reader
	announces each message without interrupting whatever the user is doing.
-->
<div class="toaster" role="status" aria-live="polite">
	{#each toasts.items as toast (toast.id)}
		<div
			class="toast toast-{toast.kind}"
			animate:flip={{ duration: 200 }}
			in:fly={{ y: 12, duration: 180 }}
			out:fly={{ y: 8, duration: 140 }}
		>
			<span class="dot" aria-hidden="true"></span>
			<span class="message">{toast.message}</span>

			{#if toast.action}
				<button
					class="action"
					type="button"
					onclick={() => {
						toast.action?.run();
						toasts.dismiss(toast.id);
					}}
				>
					{toast.action.label}
				</button>
			{/if}

			<button class="close" type="button" aria-label="Dismiss" onclick={() => toasts.dismiss(toast.id)}>
				×
			</button>
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		bottom: var(--ru-space-4);
		left: 50%;
		transform: translateX(-50%);
		z-index: 60;
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-2);
		width: min(440px, calc(100vw - 32px));
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: var(--ru-space-2);
		padding: 11px 12px 11px 14px;
		border: 1px solid var(--border);
		border-radius: var(--ru-radius-md);
		background: var(--surface);
		box-shadow: var(--ru-shadow-md);
		font-size: var(--ru-font-size-md);
		pointer-events: auto;
	}

	.dot {
		flex-shrink: 0;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--text-muted);
	}

	.toast-success .dot {
		background: #16a34a;
	}

	.toast-error .dot {
		background: var(--danger);
	}

	.toast-info .dot {
		background: var(--accent);
	}

	.message {
		flex: 1;
		min-width: 0;
	}

	.action {
		flex-shrink: 0;
		padding: 4px 10px;
		border: 1px solid var(--border);
		border-radius: var(--ru-radius-sm);
		background: transparent;
		color: var(--accent);
		font: inherit;
		font-size: var(--ru-font-size-sm);
		font-weight: 600;
		cursor: pointer;
	}

	.action:hover {
		background: var(--accent-soft);
	}

	.close {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--text-muted);
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
	}

	.close:hover {
		background: var(--surface-muted);
		color: var(--text);
	}
</style>
