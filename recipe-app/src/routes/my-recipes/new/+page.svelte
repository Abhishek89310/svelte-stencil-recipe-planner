<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { RecipeDraft } from '$lib/state/my-recipes.svelte';
	import { myRecipes } from '$lib/state/my-recipes.svelte';
	import { toasts } from '$lib/state/toasts.svelte';
	import { emptyDraft } from '$lib/validation';
	import { listAreas, listCategories } from '$lib/api/themealdb';
	import RecipeForm from '$lib/components/RecipeForm.svelte';

	let categories = $state<string[]>([]);
	let areas = $state<string[]>([]);

	// Suggestions only; the form works fine if these never arrive.
	onMount(async () => {
		try {
			[categories, areas] = await Promise.all([listCategories(), listAreas()]);
		} catch {
			console.warn('[new recipe] Could not load category suggestions.');
		}
	});

	function save(draft: RecipeDraft) {
		const recipe = myRecipes.create(draft);
		toasts.success(`Saved "${recipe.name}".`);
		void goto(`/recipes/${recipe.id}`);
	}
</script>

<svelte:head>
	<title>New recipe · Recipe Finder &amp; Meal Planner</title>
</svelte:head>

<div class="page stack">
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<a href="/my-recipes">My recipes</a>
		<span aria-hidden="true">/</span>
		<span class="muted">New recipe</span>
	</nav>

	<div class="page-header">
		<div>
			<h1>Write a recipe</h1>
			<p>It is saved in this browser and appears in search results alongside community recipes.</p>
		</div>
	</div>

	<RecipeForm
		initial={emptyDraft()}
		submitLabel="Save recipe"
		{categories}
		{areas}
		onsave={save}
		oncancel={() => goto('/my-recipes')}
	/>
</div>

<style>
	.breadcrumb {
		display: flex;
		gap: var(--ru-space-2);
		font-size: var(--ru-font-size-sm);
	}
</style>
