<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { SearchDetail } from '@iosdev_89/recipe-ui';
	import type { Recipe, RecipeSummary } from '$lib/types';
	import {
		filterByArea,
		filterByCategory,
		filterByIngredient,
		getRandomRecipes,
		listAreas,
		listCategories,
		searchRecipes,
		RecipeApiError
	} from '$lib/api/themealdb';
	import { myRecipes } from '$lib/state/my-recipes.svelte';
	import { toasts } from '$lib/state/toasts.svelte';
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import SkeletonGrid from '$lib/components/SkeletonGrid.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	type SourceFilter = 'all' | 'api' | 'mine';

	let query = $state('');
	let category = $state('');
	let area = $state('');
	let ingredient = $state('');
	let source = $state<SourceFilter>('all');

	let results = $state<(Recipe | RecipeSummary)[]>([]);
	let categories = $state<string[]>([]);
	let areas = $state<string[]>([]);

	let loading = $state(true);
	let error = $state('');
	/** Describes what produced the current result set, shown above the grid. */
	let resultLabel = $state('Fresh picks for you');

	/**
	 * One in-flight request at a time. A debounced search fires on every
	 * keystroke, so without this an older, slower response could land after a
	 * newer one and overwrite it.
	 */
	let inFlight: AbortController | null = null;

	/** The user's own recipes matching the current text query. */
	const localMatches = $derived(myRecipes.search(query));

	/**
	 * API results and local recipes merged according to the source filter.
	 * Local recipes come first: they are the ones the user actually wrote.
	 */
	const visible = $derived.by(() => {
		if (source === 'mine') return localMatches;
		if (source === 'api') return results;
		return [...localMatches, ...results];
	});

	const hasActiveFilter = $derived(
		query !== '' || category !== '' || area !== '' || ingredient !== '' || source !== 'all'
	);

	onMount(() => {
		void loadInitial();
		void loadFilterOptions();
	});

	async function loadFilterOptions() {
		try {
			const [categoryList, areaList] = await Promise.all([listCategories(), listAreas()]);
			categories = categoryList;
			areas = areaList;
		} catch {
			// Filters are an enhancement; search still works without the dropdowns.
			console.warn('[discover] Could not load filter options.');
		}
	}

	/** Runs a request, guarding against out-of-order responses. */
	async function run(
		label: string,
		fetcher: (signal: AbortSignal) => Promise<(Recipe | RecipeSummary)[]>
	) {
		inFlight?.abort();
		const controller = new AbortController();
		inFlight = controller;

		loading = true;
		error = '';

		try {
			const data = await fetcher(controller.signal);
			if (controller.signal.aborted) return;
			results = data;
			resultLabel = label;
		} catch (cause) {
			if (cause instanceof DOMException && cause.name === 'AbortError') return;
			error =
				cause instanceof RecipeApiError
					? cause.message
					: 'Something went wrong loading recipes. Please try again.';
			results = [];
		} finally {
			if (inFlight === controller) {
				loading = false;
				inFlight = null;
			}
		}
	}

	function loadInitial() {
		return run('Fresh picks for you', (signal) => getRandomRecipes(12, signal));
	}

	/** A readable description of whatever combination is currently active. */
	function describeFilters(): string {
		const q = query.trim();
		const ing = ingredient.trim();

		const parts: string[] = [];
		if (category) parts.push(category);
		if (area) parts.push(area);
		if (ing) parts.push(`with ${ing}`);

		if (parts.length === 0 && !q) return 'Fresh picks for you';

		const base = parts.length > 0 ? `${parts.join(' · ')} recipes` : 'Recipes';
		return q ? `${base} matching “${q}”` : base;
	}

	/** Keeps only the entries whose id appears in every set — a set intersection. */
	function intersectById(sets: RecipeSummary[][]): RecipeSummary[] {
		const [first, ...rest] = sets;
		if (!first) return [];

		const otherIds = rest.map((set) => new Set(set.map((entry) => entry.id)));
		return first.filter((entry) => otherIds.every((ids) => ids.has(entry.id)));
	}

	function matchesIngredient(recipe: Recipe, needle: string): boolean {
		const lower = needle.toLowerCase();
		return recipe.ingredients.some((item) => item.name.toLowerCase().includes(lower));
	}

	/**
	 * Resolves every active filter into a single result set.
	 *
	 * TheMealDB has no combined-filter endpoint - `filter.php` handles exactly one
	 * of category, cuisine or ingredient per request. Rather than letting one
	 * filter cancel the others, each active filter is requested in parallel and
	 * the id sets are intersected. That produces a true AND in two or three
	 * requests, instead of one request per candidate recipe.
	 *
	 * A text query takes a different path: `search.php` returns complete recipes,
	 * so the remaining filters are applied to those directly.
	 */
	function applyFilters() {
		const q = query.trim();
		const ing = ingredient.trim();
		const label = describeFilters();

		if (q) {
			return run(label, async (signal) => {
				let list = await searchRecipes(q, signal);
				if (category) list = list.filter((recipe) => recipe.category === category);
				if (area) list = list.filter((recipe) => recipe.area === area);
				if (ing) list = list.filter((recipe) => matchesIngredient(recipe, ing));
				return list;
			});
		}

		if (!category && !area && !ing) return loadInitial();

		return run(label, async (signal) => {
			const requests: Promise<RecipeSummary[]>[] = [];
			if (category) requests.push(filterByCategory(category, signal));
			if (area) requests.push(filterByArea(area, signal));
			if (ing) requests.push(filterByIngredient(ing, signal));

			return intersectById(await Promise.all(requests));
		});
	}

	/** `searchInput` from <recipe-search-bar>: already debounced by the component. */
	function handleSearchInput(event: CustomEvent<SearchDetail>) {
		query = event.detail.query;
		void applyFilters();
	}

	/** `searchSubmit` from <recipe-search-bar>: Enter or the button. */
	function handleSearchSubmit(event: CustomEvent<SearchDetail>) {
		query = event.detail.query;
		void applyFilters();
	}

	/** `searchClear` from <recipe-search-bar>. */
	function handleSearchClear() {
		query = '';
		void applyFilters();
	}

	function resetAll() {
		query = '';
		category = '';
		area = '';
		ingredient = '';
		source = 'all';
		void loadInitial();
		toasts.info('Filters cleared.');
	}

	function onCategoryChange(value: string) {
		category = value;
		void applyFilters();
	}

	function onAreaChange(value: string) {
		area = value;
		void applyFilters();
	}

	let ingredientTimer: ReturnType<typeof setTimeout>;

	function onIngredientInput(value: string) {
		ingredient = value;
		clearTimeout(ingredientTimer);
		ingredientTimer = setTimeout(() => void applyFilters(), 450);
	}
</script>

<svelte:head>
	<title>Discover recipes · Recipe Finder &amp; Meal Planner</title>
</svelte:head>

<div class="page stack">
	<section class="hero">
		<h1>Find something worth cooking</h1>
		<p class="muted">
			Search thousands of recipes, save the ones you love, and lay out your week — all in one place.
		</p>

		<!--
			<recipe-search-bar> is a Stencil web component from the published npm
			package. Filters below are projected into its named "filters" slot, and
			the result count into its default slot.
		-->
		<recipe-search-bar
			placeholder="Search by name, e.g. “pasta”, “chicken”, “brownies”"
			value={query}
			loading={loading}
			submit-label="Search"
			onsearchInput={handleSearchInput}
			onsearchSubmit={handleSearchSubmit}
			onsearchClear={handleSearchClear}
		>
			<div slot="filters" class="filters">
				<label class="filter">
					<span class="visually-hidden">Filter by category</span>
					<select
						value={category}
						onchange={(event) => onCategoryChange(event.currentTarget.value)}
					>
						<option value="">All categories</option>
						{#each categories as name (name)}
							<option value={name}>{name}</option>
						{/each}
					</select>
				</label>

				<label class="filter">
					<span class="visually-hidden">Filter by cuisine</span>
					<select value={area} onchange={(event) => onAreaChange(event.currentTarget.value)}>
						<option value="">All cuisines</option>
						{#each areas as name (name)}
							<option value={name}>{name}</option>
						{/each}
					</select>
				</label>

				<label class="filter">
					<span class="visually-hidden">Filter by main ingredient</span>
					<input
						type="text"
						placeholder="Main ingredient"
						value={ingredient}
						oninput={(event) => onIngredientInput(event.currentTarget.value)}
					/>
				</label>

				<div class="segmented" role="group" aria-label="Recipe source">
					{#each [['all', 'All'], ['api', 'Community'], ['mine', 'Mine']] as [value, label] (value)}
						<button
							type="button"
							class="segment"
							class:is-active={source === value}
							aria-pressed={source === value}
							onclick={() => (source = value as SourceFilter)}
						>
							{label}
						</button>
					{/each}
				</div>

				{#if hasActiveFilter}
					<button class="btn btn-sm btn-ghost" type="button" onclick={resetAll}>Clear all</button>
				{/if}
			</div>

			<span class="count muted">
				{#if loading}
					Searching…
				{:else}
					{visible.length}
					{visible.length === 1 ? 'recipe' : 'recipes'}
				{/if}
			</span>
		</recipe-search-bar>
	</section>

	<section class="results">
		<div class="page-header">
			<h2>{source === 'mine' ? 'Your recipes' : resultLabel}</h2>
			{#if !loading && !error}
				<a class="btn btn-sm" href={resolve('/my-recipes/new')}>Add your own recipe</a>
			{/if}
		</div>

		{#if error}
			<div class="alert" role="alert">
				<strong>Could not load recipes.</strong>
				<span>{error}</span>
				<button class="btn btn-sm" type="button" onclick={() => void applyFilters()}>Retry</button>
			</div>
		{:else if loading && source !== 'mine'}
			<SkeletonGrid count={8} />
		{:else if visible.length === 0}
			<EmptyState
				icon="🔍"
				title="No recipes matched"
				description={hasActiveFilter
					? 'Try a different search term, or loosen the filters.'
					: 'Nothing to show just yet.'}
			>
				<button class="btn" type="button" onclick={resetAll}>Clear filters</button>
				<a class="btn btn-primary" href={resolve('/my-recipes/new')}>Write your own</a>
			</EmptyState>
		{:else}
			<RecipeGrid recipes={visible} />
		{/if}
	</section>
</div>

<style>
	.hero {
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-3);
		padding: var(--ru-space-5) 0 var(--ru-space-2);
	}

	.hero p {
		max-width: 60ch;
		font-size: 1.0625rem;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--ru-space-2);
		width: 100%;
	}

	.filter {
		flex: 1 1 160px;
		min-width: 150px;
		max-width: 220px;
	}

	.count {
		font-size: var(--ru-font-size-sm);
		font-variant-numeric: tabular-nums;
	}

	.segmented {
		display: inline-flex;
		padding: 3px;
		border: 1px solid var(--border);
		border-radius: var(--ru-radius-pill);
		background: var(--surface);
	}

	.segment {
		padding: 5px 13px;
		border: none;
		border-radius: var(--ru-radius-pill);
		background: transparent;
		color: var(--text-muted);
		font: inherit;
		font-size: var(--ru-font-size-sm);
		font-weight: 600;
		cursor: pointer;
		transition:
			background var(--ru-transition),
			color var(--ru-transition);
	}

	.segment.is-active {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.results {
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-4);
	}

	.alert {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--ru-space-2);
		padding: var(--ru-space-4);
		border: 1px solid color-mix(in srgb, var(--danger) 35%, var(--border));
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--danger) 7%, var(--surface));
		font-size: var(--ru-font-size-md);
	}

	.alert span {
		flex: 1 1 260px;
		color: var(--text-muted);
	}
</style>
