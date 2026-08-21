<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { RecipeDraft } from '$lib/state/my-recipes.svelte';
	import { myRecipes } from '$lib/state/my-recipes.svelte';
	import { toasts } from '$lib/state/toasts.svelte';
	import { listAreas, listCategories } from '$lib/api/themealdb';
	import RecipeForm from '$lib/components/RecipeForm.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	const recipeId = $derived(page.params.id);
	const recipe = $derived(recipeId ? myRecipes.get(recipeId) : undefined);

	/** Only the user's own fields are editable; id and timestamps stay with the store. */
	const initial = $derived<RecipeDraft | null>(
		recipe
			? {
					name: recipe.name,
					category: recipe.category,
					area: recipe.area,
					instructions: recipe.instructions,
					image: recipe.image,
					tags: recipe.tags,
					ingredients: recipe.ingredients,
					source: recipe.source,
					youtube: recipe.youtube
				}
			: null
	);

	let categories = $state<string[]>([]);
	let areas = $state<string[]>([]);

	onMount(async () => {
		try {
			[categories, areas] = await Promise.all([listCategories(), listAreas()]);
		} catch {
			console.warn('[edit recipe] Could not load category suggestions.');
		}
	});

	function save(draft: RecipeDraft) {
		if (!recipeId) return;

		const updated = myRecipes.update(recipeId, draft);
		if (!updated) {
			toasts.error('That recipe no longer exists.');
			void goto(resolve('/my-recipes'));
			return;
		}

		toasts.success(`Updated "${updated.name}".`);
		void goto(resolve('/recipes/[id]', { id: updated.id }));
	}
</script>

<svelte:head>
	<title>{recipe ? `Edit ${recipe.name}` : 'Recipe not found'} · Recipe Finder</title>
</svelte:head>

<div class="page stack">
	{#if !recipe || !initial}
		<EmptyState
			icon="🫙"
			title="Recipe not found"
			description="Only recipes you created in this browser can be edited."
		>
			<a class="btn btn-primary" href={resolve('/my-recipes')}>Back to my recipes</a>
		</EmptyState>
	{:else}
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href={resolve('/my-recipes')}>My recipes</a>
			<span aria-hidden="true">/</span>
			<a href={resolve('/recipes/[id]', { id: recipe.id })}>{recipe.name}</a>
			<span aria-hidden="true">/</span>
			<span class="muted">Edit</span>
		</nav>

		<div class="page-header">
			<div>
				<h1>Edit recipe</h1>
				{#if recipe.createdAt}
					<p>Created {new Date(recipe.createdAt).toLocaleDateString()}.</p>
				{/if}
			</div>
		</div>

		<RecipeForm
			{initial}
			submitLabel="Save changes"
			{categories}
			{areas}
			onsave={save}
			oncancel={() => goto(resolve('/recipes/[id]', { id: recipe.id }))}
		/>
	{/if}
</div>

<style>
	.breadcrumb {
		display: flex;
		flex-wrap: wrap;
		gap: var(--ru-space-2);
		font-size: var(--ru-font-size-sm);
	}
</style>
