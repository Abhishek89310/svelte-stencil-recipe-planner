<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} · Recipe Finder &amp; Meal Planner</title>
</svelte:head>

<div class="page error-page">
	<span class="code">{page.status}</span>
	<h1>{page.status === 404 ? 'Page not found' : 'Something went wrong'}</h1>
	<p class="muted">{page.error?.message ?? 'An unexpected error occurred.'}</p>

	<div class="actions">
		<a class="btn btn-primary" href={resolve('/')}>Back to discover</a>
		<button class="btn" type="button" onclick={() => history.back()}>Go back</button>
	</div>
</div>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--ru-space-2);
		min-height: 55vh;
		text-align: center;
	}

	.code {
		font-size: 3.5rem;
		font-weight: 700;
		line-height: 1;
		color: var(--accent);
		letter-spacing: -0.04em;
	}

	p {
		max-width: 46ch;
	}

	.actions {
		display: flex;
		gap: var(--ru-space-2);
		margin-top: var(--ru-space-4);
		flex-wrap: wrap;
		justify-content: center;
	}
</style>
