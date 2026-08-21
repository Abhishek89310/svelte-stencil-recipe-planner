<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 8 }: Props = $props();
</script>

<!-- Placeholder cards matching the real grid's geometry, so nothing shifts on load. -->
<div class="card-grid" aria-hidden="true">
	{#each Array.from({ length: count }) as _, index (index)}
		<div class="skeleton">
			<div class="media"></div>
			<div class="line line-title"></div>
			<div class="line line-meta"></div>
			<div class="line line-button"></div>
		</div>
	{/each}
</div>

<style>
	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding-bottom: var(--ru-space-4);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.media {
		aspect-ratio: 4 / 3;
	}

	.line {
		height: 12px;
		margin: 0 var(--ru-space-4);
		border-radius: 4px;
	}

	.line-title {
		width: 75%;
		height: 16px;
	}

	.line-meta {
		width: 45%;
	}

	.line-button {
		height: 34px;
		border-radius: var(--ru-radius-sm);
		margin-top: 6px;
	}

	.media,
	.line {
		background: linear-gradient(
			90deg,
			var(--surface-muted) 25%,
			color-mix(in srgb, var(--border) 55%, var(--surface-muted)) 37%,
			var(--surface-muted) 63%
		);
		background-size: 400% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	@keyframes shimmer {
		from {
			background-position: 100% 50%;
		}
		to {
			background-position: 0 50%;
		}
	}
</style>
