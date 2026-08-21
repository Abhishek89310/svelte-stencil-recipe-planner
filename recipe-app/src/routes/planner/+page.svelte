<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Day, Meal, Recipe, RecipeSummary } from '$lib/types';
	import { DAYS, MEALS } from '$lib/types';
	import type { MealDropDetail, MealSlotDetail } from '@iosdev_89/recipe-ui';
	import { mealPlan } from '$lib/state/meal-plan.svelte';
	import { favorites } from '$lib/state/favorites.svelte';
	import { myRecipes } from '$lib/state/my-recipes.svelte';
	import { toasts } from '$lib/state/toasts.svelte';
	import { getRecipeById, searchRecipes } from '$lib/api/themealdb';
	import EmptyState from '$lib/components/EmptyState.svelte';

	/** Which cell the picker dialog is filling. */
	let picking = $state<{ day: Day; meal: Meal } | null>(null);
	let pickerQuery = $state('');
	let pickerResults = $state<Recipe[]>([]);
	let pickerLoading = $state(false);
	let clearOpen = $state(false);

	const today = $derived(
		new Date().toLocaleDateString('en-GB', { weekday: 'long' }) as Day
	);

	/** Favourites and own recipes, offered before the user searches. */
	const suggestions = $derived<RecipeSummary[]>([
		...myRecipes.items.map((recipe) => ({
			id: recipe.id,
			name: recipe.name,
			image: recipe.image,
			category: recipe.category,
			area: recipe.area,
			origin: recipe.origin
		})),
		...favorites.items.map((entry) => ({
			id: entry.id,
			name: entry.name,
			image: entry.image,
			category: entry.category,
			area: entry.area,
			origin: entry.origin
		}))
	]);

	/** Deduplicated, since a user recipe can also be favourited. */
	const uniqueSuggestions = $derived(
		suggestions.filter(
			(entry, index) => suggestions.findIndex((other) => other.id === entry.id) === index
		)
	);

	/** What the picker lists: search results once a query is typed, suggestions otherwise. */
	const pickerOptions = $derived(pickerQuery.trim() ? pickerResults : uniqueSuggestions);

	let pickerTimer: ReturnType<typeof setTimeout>;

	function onPickerInput(value: string) {
		pickerQuery = value;
		clearTimeout(pickerTimer);

		if (!value.trim()) {
			pickerResults = [];
			pickerLoading = false;
			return;
		}

		pickerLoading = true;
		pickerTimer = setTimeout(async () => {
			try {
				pickerResults = await searchRecipes(value);
			} catch {
				pickerResults = [];
				toasts.error('Could not search recipes right now.');
			} finally {
				pickerLoading = false;
			}
		}, 350);
	}

	/** `mealAssign` from <meal-slot>: an empty cell was activated. */
	function handleAssign(event: CustomEvent<MealSlotDetail>) {
		picking = { day: event.detail.day as Day, meal: event.detail.meal as Meal };
		pickerQuery = '';
		pickerResults = [];
	}

	/** `mealOpen` from <meal-slot>: a filled cell was activated. */
	function handleOpen(event: CustomEvent<MealSlotDetail>) {
		if (event.detail.recipeId) void goto(`/recipes/${event.detail.recipeId}`);
	}

	/** `mealRemove` from <meal-slot>, with undo. */
	function handleRemove(event: CustomEvent<MealSlotDetail>) {
		const day = event.detail.day as Day;
		const meal = event.detail.meal as Meal;
		const removed = mealPlan.get(day, meal);
		if (!removed) return;

		mealPlan.remove(day, meal);

		toasts.info(`Removed "${removed.name}" from ${day} ${meal.toLowerCase()}.`, {
			label: 'Undo',
			run: () =>
				mealPlan.assign(day, meal, {
					id: removed.recipeId,
					name: removed.name,
					image: removed.image,
					category: removed.meta,
					origin: removed.origin
				})
		});
	}

	/**
	 * `mealDrop` from <meal-slot>. The payload is only a recipe id, so it is
	 * resolved against local state first and the API second.
	 */
	async function handleDrop(event: CustomEvent<MealDropDetail>) {
		const day = event.detail.day as Day;
		const meal = event.detail.meal as Meal;
		const id = event.detail.droppedRecipeId;

		const local = uniqueSuggestions.find((entry) => entry.id === id);
		if (local) {
			mealPlan.assign(day, meal, local);
			toasts.success(`Added "${local.name}" to ${day} ${meal.toLowerCase()}.`);
			return;
		}

		try {
			const recipe = await getRecipeById(id);
			if (!recipe) {
				toasts.error('That recipe could not be found.');
				return;
			}
			mealPlan.assign(day, meal, recipe);
			toasts.success(`Added "${recipe.name}" to ${day} ${meal.toLowerCase()}.`);
		} catch {
			toasts.error('Could not add that recipe. Please try again.');
		}
	}

	function choose(recipe: Recipe | RecipeSummary) {
		if (!picking) return;

		const { day, meal } = picking;
		mealPlan.assign(day, meal, recipe);
		picking = null;

		toasts.success(`Added "${recipe.name}" to ${day} ${meal.toLowerCase()}.`);
	}

	function clearWeek() {
		const count = mealPlan.plannedCount;
		mealPlan.clearAll();
		clearOpen = false;
		toasts.info(`Cleared ${count} planned ${count === 1 ? 'meal' : 'meals'}.`);
	}

	/** A plain-text shopping-style summary the user can copy out. */
	function copyPlan() {
		const lines: string[] = ['Weekly meal plan', ''];

		for (const day of DAYS) {
			const meals = MEALS.map((meal) => {
				const entry = mealPlan.get(day, meal);
				return entry ? `  ${meal}: ${entry.name}` : null;
			}).filter(Boolean);

			if (meals.length > 0) {
				lines.push(day, ...(meals as string[]), '');
			}
		}

		navigator.clipboard
			.writeText(lines.join('\n'))
			.then(() => toasts.success('Meal plan copied to the clipboard.'))
			.catch(() => toasts.error('Could not copy the plan.'));
	}
</script>

<svelte:head>
	<title>Weekly planner · Recipe Finder &amp; Meal Planner</title>
</svelte:head>

<div class="page stack">
	<div class="page-header">
		<div>
			<h1>Weekly planner</h1>
			<p>
				{mealPlan.plannedCount === 0
					? 'Pick a slot to assign a recipe, or drag a card from anywhere in the app.'
					: `${mealPlan.plannedCount} of 21 slots planned, using ${mealPlan.uniqueRecipeIds.length} ${mealPlan.uniqueRecipeIds.length === 1 ? 'recipe' : 'recipes'}.`}
			</p>
		</div>

		{#if mealPlan.plannedCount > 0}
			<div class="toolbar">
				<button class="btn btn-sm" type="button" onclick={copyPlan}>Copy as text</button>
				<button class="btn btn-sm btn-danger" type="button" onclick={() => (clearOpen = true)}>
					Clear week
				</button>
			</div>
		{/if}
	</div>

	<div class="planner" role="grid" aria-label="Weekly meal plan">
		<div class="planner-head" role="row">
			<span class="corner" role="columnheader" aria-label="Meal"></span>
			{#each MEALS as meal (meal)}
				<span class="meal-head" role="columnheader">{meal}</span>
			{/each}
		</div>

		{#each DAYS as day (day)}
			<div class="planner-row" class:is-today={day === today} role="row">
				<div class="day-head" role="rowheader">
					<span class="day-name">{day}</span>
					{#if day === today}
						<span class="chip today-chip">Today</span>
					{/if}
					{#if MEALS.some((meal) => mealPlan.get(day, meal))}
						<button
							class="btn btn-sm btn-ghost clear-day"
							type="button"
							onclick={() => mealPlan.clearDay(day)}
						>
							Clear
						</button>
					{/if}
				</div>

				{#each MEALS as meal (meal)}
					{@const entry = mealPlan.get(day, meal)}
					<div class="cell" role="gridcell">
						<!--
							<meal-slot> is a Stencil component. Data goes down as
							properties; the four events below come back up. It is also a
							drop target, which is how a dragged recipe card lands here.
						-->
						<meal-slot
							day={day}
							meal={meal}
							recipe-id={entry?.recipeId ?? ''}
							recipe-name={entry?.name ?? ''}
							recipe-image={entry?.image ?? ''}
							recipe-meta={entry?.meta ?? ''}
							highlighted={day === today}
							onmealAssign={handleAssign}
							onmealOpen={handleOpen}
							onmealRemove={handleRemove}
							onmealDrop={handleDrop}
						></meal-slot>
					</div>
				{/each}
			</div>
		{/each}
	</div>

	{#if mealPlan.plannedCount === 0 && uniqueSuggestions.length === 0}
		<EmptyState
			icon="🗓️"
			title="Nothing planned yet"
			description="Save a few favourites or write your own recipes, then assign them to the week."
		>
			<a class="btn btn-primary" href="/">Find recipes</a>
			<a class="btn" href="/my-recipes/new">Write a recipe</a>
		</EmptyState>
	{/if}
</div>

<!-- Recipe picker, opened by a slot's `mealAssign` event. -->
<modal-dialog
	open={picking !== null}
	heading={picking ? `${picking.meal} on ${picking.day}` : ''}
	subheading="Choose a recipe for this slot"
	width="640px"
	ondialogClose={() => (picking = null)}
>
	<div class="picker">
		<input
			type="search"
			placeholder="Search all recipes…"
			value={pickerQuery}
			oninput={(event) => onPickerInput(event.currentTarget.value)}
			aria-label="Search recipes to plan"
		/>

		{#if pickerLoading}
			<p class="muted picker-status">Searching…</p>
		{:else if pickerQuery.trim() && pickerResults.length === 0}
			<p class="muted picker-status">No recipes matched “{pickerQuery}”.</p>
		{/if}

		{#if pickerOptions.length > 0}
			<p class="picker-label">
				{pickerQuery.trim() ? 'Search results' : 'Your favourites and own recipes'}
			</p>

			<ul class="picker-list">
				{#each pickerOptions.slice(0, 40) as option (option.id)}
					<li>
						<button class="option" type="button" onclick={() => choose(option)}>
							{#if option.image}
								<img src={option.image} alt="" width="44" height="44" loading="lazy" />
							{:else}
								<span class="option-fallback" aria-hidden="true">{option.name.charAt(0)}</span>
							{/if}
							<span class="option-text">
								<span class="option-name">{option.name}</span>
								<span class="option-meta muted">
									{option.category ?? 'Recipe'}{option.origin === 'local' ? ' · yours' : ''}
								</span>
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{:else if !pickerQuery.trim()}
			<p class="muted picker-status">
				Search above, or save some favourites first to see them here.
			</p>
		{/if}
	</div>

	<div slot="footer">
		<button class="btn" type="button" onclick={() => (picking = null)}>Cancel</button>
	</div>
</modal-dialog>

<modal-dialog
	open={clearOpen}
	heading="Clear the whole week?"
	subheading="{mealPlan.plannedCount} planned meals will be removed"
	width="420px"
	ondialogClose={() => (clearOpen = false)}
>
	<p>Your favourites and your own recipes are not affected.</p>

	<div slot="footer">
		<button class="btn" type="button" onclick={() => (clearOpen = false)}>Cancel</button>
		<button class="btn btn-danger" type="button" onclick={clearWeek}>Clear week</button>
	</div>
</modal-dialog>

<style>
	.toolbar {
		display: flex;
		gap: var(--ru-space-2);
		flex-wrap: wrap;
	}

	.planner {
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-2);
	}

	.planner-head,
	.planner-row {
		display: grid;
		grid-template-columns: 148px repeat(3, minmax(0, 1fr));
		gap: var(--ru-space-2);
		align-items: stretch;
	}

	.meal-head {
		padding: 0 var(--ru-space-2) 2px;
		font-size: var(--ru-font-size-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.day-head {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		padding: var(--ru-space-2) var(--ru-space-3);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.is-today .day-head {
		border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
		background: color-mix(in srgb, var(--accent-soft) 55%, var(--surface));
	}

	.day-name {
		font-weight: 650;
		font-size: var(--ru-font-size-md);
	}

	.today-chip {
		font-size: 0.6875rem;
		padding: 1px 8px;
	}

	.clear-day {
		margin-top: auto;
		padding: 2px 0;
		font-size: var(--ru-font-size-sm);
		color: var(--text-muted);
	}

	.clear-day:hover {
		color: var(--danger);
	}

	/* ---------- picker ---------- */

	.picker {
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-3);
	}

	.picker-status {
		font-size: var(--ru-font-size-md);
		padding: var(--ru-space-3) 0;
	}

	.picker-label {
		font-size: var(--ru-font-size-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.picker-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
		max-height: 46vh;
		overflow-y: auto;
	}

	.option {
		display: flex;
		align-items: center;
		gap: var(--ru-space-3);
		width: 100%;
		padding: var(--ru-space-2);
		border: 1px solid transparent;
		border-radius: var(--ru-radius-sm);
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.option:hover {
		background: var(--surface-muted);
		border-color: var(--border);
	}

	.option img,
	.option-fallback {
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border-radius: var(--ru-radius-sm);
		object-fit: cover;
	}

	.option-fallback {
		display: grid;
		place-items: center;
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 700;
	}

	.option-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.option-name {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.option-meta {
		font-size: var(--ru-font-size-sm);
	}

	@media (max-width: 760px) {
		.planner-head {
			display: none;
		}

		.planner-row {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--ru-space-1);
			padding-bottom: var(--ru-space-3);
			border-bottom: 1px solid var(--border);
		}

		.day-head {
			flex-direction: row;
			align-items: center;
			gap: var(--ru-space-2);
			border: none;
			background: transparent;
			padding-left: 0;
		}

		.clear-day {
			margin-top: 0;
			margin-left: auto;
		}
	}
</style>
