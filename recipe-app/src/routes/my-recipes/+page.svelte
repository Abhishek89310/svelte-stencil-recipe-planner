<script lang="ts">
	import { resolve } from '$app/paths';
	import { myRecipes } from '$lib/state/my-recipes.svelte';
	import { favorites } from '$lib/state/favorites.svelte';
	import { mealPlan } from '$lib/state/meal-plan.svelte';
	import { ratings } from '$lib/state/ratings.svelte';
	import { toasts } from '$lib/state/toasts.svelte';
	import type { Recipe } from '$lib/types';
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	let query = $state('');
	let pendingDelete = $state<Recipe | null>(null);

	const visible = $derived(myRecipes.search(query));

	function confirmDelete() {
		const recipe = pendingDelete;
		if (!recipe) return;

		const removedFromPlan = mealPlan.removeRecipeEverywhere(recipe.id);
		favorites.remove(recipe.id);
		ratings.remove(recipe.id);
		myRecipes.remove(recipe.id);
		pendingDelete = null;

		toasts.success(
			removedFromPlan > 0
				? `Deleted "${recipe.name}" and cleared ${removedFromPlan} planned ${removedFromPlan === 1 ? 'meal' : 'meals'}.`
				: `Deleted "${recipe.name}".`
		);
	}
</script>

<svelte:head>
	<title>My recipes · Recipe Finder &amp; Meal Planner</title>
</svelte:head>

<div class="page stack">
	<div class="page-header">
		<div>
			<h1>My recipes</h1>
			<p>
				{myRecipes.count === 0
					? 'Recipes you write are saved in this browser and appear alongside search results.'
					: `${myRecipes.count} ${myRecipes.count === 1 ? 'recipe' : 'recipes'} you have written.`}
			</p>
		</div>

		<a class="btn btn-primary" href={resolve('/my-recipes/new')}>New recipe</a>
	</div>

	{#if myRecipes.count === 0}
		<EmptyState
			icon="📝"
			title="No recipes of your own yet"
			description="Add a family recipe, a weeknight favourite, or anything you want to keep and plan around."
		>
			<a class="btn btn-primary" href={resolve('/my-recipes/new')}>Write your first recipe</a>
		</EmptyState>
	{:else}
		<div class="toolbar">
			<input
				type="search"
				placeholder="Filter your recipes by name, category or tag"
				bind:value={query}
				aria-label="Filter your recipes"
			/>
			<span class="muted count">{visible.length} of {myRecipes.count}</span>
		</div>

		{#if visible.length === 0}
			<EmptyState icon="🔍" title="No matches" description="Nothing here matched “{query}”.">
				<button class="btn" type="button" onclick={() => (query = '')}>Clear filter</button>
			</EmptyState>
		{:else}
			<RecipeGrid recipes={visible} />

			<section class="panel manage">
				<h2>Manage</h2>
				<p class="muted">Edit or delete any recipe you have written.</p>

				<ul class="rows">
					{#each visible as recipe (recipe.id)}
						<li class="row">
							<a class="row-main" href={resolve('/recipes/[id]', { id: recipe.id })}>
								<span class="row-name">{recipe.name}</span>
								<span class="row-meta muted">
									{recipe.category} · {recipe.ingredients.length}
									{recipe.ingredients.length === 1 ? 'ingredient' : 'ingredients'}
									{#if recipe.updatedAt}
										· updated {new Date(recipe.updatedAt).toLocaleDateString()}
									{/if}
								</span>
							</a>

							<div class="row-actions">
								<a class="btn btn-sm" href={resolve('/my-recipes/[id]/edit', { id: recipe.id })}>Edit</a>
								<button
									class="btn btn-sm btn-danger"
									type="button"
									onclick={() => (pendingDelete = recipe)}
								>
									Delete
								</button>
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</div>

<modal-dialog
	open={pendingDelete !== null}
	heading="Delete this recipe?"
	subheading={pendingDelete?.name ?? ''}
	width="440px"
	ondialogClose={() => (pendingDelete = null)}
>
	<p>
		This permanently removes the recipe from this browser, along with its favourite status and any
		place it appears in your weekly plan.
	</p>

	<div slot="footer">
		<button class="btn" type="button" onclick={() => (pendingDelete = null)}>Keep it</button>
		<button class="btn btn-danger" type="button" onclick={confirmDelete}>Delete recipe</button>
	</div>
</modal-dialog>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		gap: var(--ru-space-3);
	}

	.toolbar input {
		max-width: 420px;
	}

	.count {
		font-size: var(--ru-font-size-sm);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.manage h2 {
		margin-bottom: 4px;
	}

	.rows {
		display: flex;
		flex-direction: column;
		margin: var(--ru-space-4) 0 0;
		padding: 0;
		list-style: none;
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--ru-space-3);
		padding: var(--ru-space-3) 0;
		border-bottom: 1px solid var(--border);
	}

	.row:last-child {
		border-bottom: none;
	}

	.row-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		color: var(--text);
	}

	.row-main:hover {
		text-decoration: none;
	}

	.row-main:hover .row-name {
		color: var(--accent);
	}

	.row-name {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row-meta {
		font-size: var(--ru-font-size-sm);
	}

	.row-actions {
		display: flex;
		gap: var(--ru-space-2);
		flex-shrink: 0;
	}

	@media (max-width: 600px) {
		.row {
			flex-wrap: wrap;
		}
	}
</style>
