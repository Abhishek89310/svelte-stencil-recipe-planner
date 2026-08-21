<script lang="ts">
	import { resolve } from '$app/paths';
	import type { RecipeSummary } from '$lib/types';
	import { favorites } from '$lib/state/favorites.svelte';
	import { toasts } from '$lib/state/toasts.svelte';
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	type SortKey = 'recent' | 'name' | 'category';

	let sort = $state<SortKey>('recent');
	let filter = $state('');
	let clearOpen = $state(false);

	/** Favourites are stored denormalised, so they render as summaries directly. */
	const asSummaries = $derived<RecipeSummary[]>(
		favorites.items.map((entry) => ({
			id: entry.id,
			name: entry.name,
			image: entry.image,
			category: entry.category,
			area: entry.area,
			origin: entry.origin
		}))
	);

	const categories = $derived([...new Set(favorites.items.map((entry) => entry.category))].sort());

	const visible = $derived.by(() => {
		const list = filter ? asSummaries.filter((entry) => entry.category === filter) : asSummaries;

		// `favorites.items` is already newest-first, so "recent" needs no sorting.
		if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
		if (sort === 'category') {
			return [...list].sort(
				(a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.name.localeCompare(b.name)
			);
		}
		return list;
	});

	function clearAll() {
		const snapshot = $state.snapshot(favorites.items);
		favorites.clear();
		clearOpen = false;

		toasts.info(`Cleared ${snapshot.length} favourites.`, {
			label: 'Undo',
			run: () => snapshot.reverse().forEach((entry) => favorites.add({ ...entry, tags: [] }))
		});
	}
</script>

<svelte:head>
	<title>Favourites · Recipe Finder &amp; Meal Planner</title>
</svelte:head>

<div class="page stack">
	<div class="page-header">
		<div>
			<h1>Favourites</h1>
			<p>
				{favorites.count === 0
					? 'Recipes you save will collect here.'
					: `${favorites.count} saved ${favorites.count === 1 ? 'recipe' : 'recipes'}, stored in this browser.`}
			</p>
		</div>

		{#if favorites.count > 0}
			<div class="toolbar">
				{#if categories.length > 1}
					<label class="toolbar-field">
						<span class="visually-hidden">Filter by category</span>
						<select bind:value={filter}>
							<option value="">All categories</option>
							{#each categories as name (name)}
								<option value={name}>{name}</option>
							{/each}
						</select>
					</label>
				{/if}

				<label class="toolbar-field">
					<span class="visually-hidden">Sort favourites</span>
					<select bind:value={sort}>
						<option value="recent">Recently added</option>
						<option value="name">Name A–Z</option>
						<option value="category">Category</option>
					</select>
				</label>

				<button class="btn btn-sm btn-danger" type="button" onclick={() => (clearOpen = true)}>
					Clear all
				</button>
			</div>
		{/if}
	</div>

	{#if favorites.count === 0}
		<EmptyState
			icon="♡"
			title="No favourites yet"
			description="Tap the heart on any recipe card to keep it here for later."
		>
			<a class="btn btn-primary" href={resolve('/')}>Browse recipes</a>
		</EmptyState>
	{:else if visible.length === 0}
		<EmptyState icon="🔍" title="Nothing in that category" description="Try a different filter.">
			<button class="btn" type="button" onclick={() => (filter = '')}>Show all</button>
		</EmptyState>
	{:else}
		<RecipeGrid recipes={visible} />
	{/if}
</div>

<modal-dialog
	open={clearOpen}
	heading="Clear all favourites?"
	subheading="{favorites.count} recipes will be removed"
	width="420px"
	ondialogClose={() => (clearOpen = false)}
>
	<p>Your own recipes and your weekly plan are not affected. You will be able to undo this once.</p>

	<div slot="footer">
		<button class="btn" type="button" onclick={() => (clearOpen = false)}>Cancel</button>
		<button class="btn btn-danger" type="button" onclick={clearAll}>Clear favourites</button>
	</div>
</modal-dialog>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--ru-space-2);
	}

	.toolbar-field select {
		min-width: 150px;
	}
</style>
