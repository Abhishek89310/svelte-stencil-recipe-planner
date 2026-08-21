<script lang="ts">
	import { favorites } from '$lib/state/favorites.svelte';
	import { myRecipes } from '$lib/state/my-recipes.svelte';
	import { mealPlan } from '$lib/state/meal-plan.svelte';
	import { toasts } from '$lib/state/toasts.svelte';
	import { STORAGE_KEYS } from '$lib/storage';

	let resetOpen = $state(false);

	/** Everything the app stores, offered as a downloadable backup. */
	function exportData() {
		const payload = {
			exportedAt: new Date().toISOString(),
			favorites: $state.snapshot(favorites.items),
			myRecipes: $state.snapshot(myRecipes.items),
			mealPlan: $state.snapshot(mealPlan.plan)
		};

		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `recipe-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
		anchor.click();
		URL.revokeObjectURL(url);

		toasts.success('Backup downloaded.');
	}

	function resetEverything() {
		favorites.clear();
		mealPlan.clearAll();
		for (const recipe of [...myRecipes.items]) {
			myRecipes.remove(recipe.id);
		}
		resetOpen = false;
		toasts.info('All local data cleared.');
	}
</script>

<svelte:head>
	<title>About · Recipe Finder &amp; Meal Planner</title>
</svelte:head>

<div class="page stack narrow">
	<div class="page-header">
		<div>
			<h1>About this app</h1>
			<p>How it is put together, and what it stores.</p>
		</div>
	</div>

	<section class="panel prose">
		<h2>What it does</h2>
		<p>
			Search and browse recipes from a public catalogue, read full ingredients and instructions,
			keep a list of favourites, write and edit your own recipes, and lay them out across a week.
		</p>

		<h2>How it is built</h2>
		<ul>
			<li>
				<strong>SvelteKit with Svelte 5</strong> for routing, rendering and state. Application
				state lives in rune-backed stores rather than a third-party state library.
			</li>
			<li>
				<strong>A StencilJS component library</strong>, published to npm and installed as a
				dependency. The cards, search bar, ingredient checklist, star rating, planner slots and
				dialogs on every page are standard custom elements from that package — not Svelte
				components.
			</li>
			<li>
				<strong>TheMealDB</strong> as the recipe source, called directly from the browser. No API
				key, no account, no server in between.
			</li>
		</ul>

		<h2>Where your data lives</h2>
		<p>
			Favourites, your own recipes, ratings and the weekly plan are written to this browser's
			<code>localStorage</code> and never leave the device. Clearing site data, or using a different
			browser or profile, means starting fresh.
		</p>

		<div class="keys">
			{#each Object.entries(STORAGE_KEYS) as [label, key] (key)}
				<div class="key-row">
					<span class="muted">{label}</span>
					<code>{key}</code>
				</div>
			{/each}
		</div>
	</section>

	<section class="panel">
		<h2>Your data</h2>
		<p class="muted stat">
			{favorites.count} favourites · {myRecipes.count} own recipes · {mealPlan.plannedCount} planned
			meals
		</p>

		<div class="actions">
			<button class="btn" type="button" onclick={exportData}>Download a backup</button>
			<button class="btn btn-danger" type="button" onclick={() => (resetOpen = true)}>
				Clear everything
			</button>
		</div>
	</section>
</div>

<modal-dialog
	open={resetOpen}
	heading="Clear all local data?"
	subheading="Favourites, your recipes, ratings and the weekly plan"
	width="440px"
	ondialogClose={() => (resetOpen = false)}
>
	<p>
		This cannot be undone. Download a backup first if you want to keep any of it.
	</p>

	<div slot="footer">
		<button class="btn" type="button" onclick={() => (resetOpen = false)}>Cancel</button>
		<button class="btn btn-danger" type="button" onclick={resetEverything}>Clear everything</button>
	</div>
</modal-dialog>

<style>
	.narrow {
		max-width: 760px;
	}

	.prose h2 {
		margin-top: var(--ru-space-5);
		margin-bottom: var(--ru-space-2);
	}

	.prose h2:first-child {
		margin-top: 0;
	}

	.prose p,
	.prose li {
		color: var(--text-muted);
	}

	.prose ul {
		margin: 0;
		padding-left: 1.2em;
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-2);
	}

	.prose strong {
		color: var(--text);
	}

	code {
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.8125rem;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--surface-muted);
		border: 1px solid var(--border);
	}

	.keys {
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-2);
		margin-top: var(--ru-space-3);
	}

	.key-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ru-space-3);
		font-size: var(--ru-font-size-sm);
	}

	.stat {
		margin: 6px 0 var(--ru-space-4);
		font-variant-numeric: tabular-nums;
	}

	.actions {
		display: flex;
		gap: var(--ru-space-2);
		flex-wrap: wrap;
	}
</style>
