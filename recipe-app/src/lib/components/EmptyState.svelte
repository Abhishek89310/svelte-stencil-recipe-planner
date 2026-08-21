<script lang="ts">
	interface Props {
		icon?: string;
		title: string;
		description?: string;
		children?: import('svelte').Snippet;
	}

	let { icon = '🍽️', title, description, children }: Props = $props();
</script>

<div class="empty">
	<span class="icon" aria-hidden="true">{icon}</span>
	<h3>{title}</h3>
	{#if description}
		<p class="muted">{description}</p>
	{/if}
	{#if children}
		<div class="actions">{@render children()}</div>
	{/if}
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--ru-space-2);
		padding: 56px var(--ru-space-4);
		text-align: center;
		background: var(--surface);
		border: 1px dashed var(--border);
		border-radius: var(--radius);
	}

	.icon {
		font-size: 2.5rem;
		line-height: 1;
		margin-bottom: var(--ru-space-1);
	}

	p {
		max-width: 46ch;
	}

	.actions {
		display: flex;
		gap: var(--ru-space-2);
		flex-wrap: wrap;
		justify-content: center;
		margin-top: var(--ru-space-3);
	}
</style>
