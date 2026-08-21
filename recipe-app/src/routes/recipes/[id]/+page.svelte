<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Day, Meal } from '$lib/types';
	import { DAYS, MEALS } from '$lib/types';
	import type { IngredientCheckDetail, RatingChangeDetail } from '@abhishek/recipe-ui';
	import { favorites } from '$lib/state/favorites.svelte';
	import { myRecipes } from '$lib/state/my-recipes.svelte';
	import { mealPlan } from '$lib/state/meal-plan.svelte';
	import { ratings } from '$lib/state/ratings.svelte';
	import { toasts } from '$lib/state/toasts.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	let { data }: { data: PageData } = $props();

	/**
	 * Either the recipe fetched by the load function, or - for a `local-` id -
	 * the live entry from the store, so an edit is reflected without a reload.
	 */
	const recipe = $derived(data.apiRecipe ?? myRecipes.get(data.id));

	const isMine = $derived(recipe?.origin === 'local');
	const isFavorite = $derived(recipe ? favorites.has(recipe.id) : false);
	const myRating = $derived(recipe ? ratings.get(recipe.id) : 0);

	/** Instructions arrive as one blob; split it into readable steps. */
	const steps = $derived(
		(recipe?.instructions ?? '')
			.split(/\r?\n+/)
			.map((line) => line.replace(/^\s*(?:STEP\s*)?\d+[.)]?\s*/i, '').trim())
			.filter((line) => line.length > 0)
	);

	const checkedOff = $state(new Set<string>());

	let planOpen = $state(false);
	let deleteOpen = $state(false);
	let planDay = $state<Day>(DAYS[0]);
	let planMeal = $state<Meal>(MEALS[1]);

	/**
	 * <ingredient-list> takes an array, and an HTML attribute can only carry a
	 * string. Setting the DOM property directly is the correct way to hand
	 * structured data to a web component - and it has to wait until the element
	 * has been upgraded, which is what `$effect` guarantees here.
	 */
	let ingredientListEl = $state<(HTMLElement & { items?: unknown }) | undefined>();

	$effect(() => {
		if (ingredientListEl && recipe) {
			ingredientListEl.items = recipe.ingredients;
		}
	});

	/** `ingredientCheck` from <ingredient-list>. */
	function handleIngredientCheck(event: CustomEvent<IngredientCheckDetail>) {
		const { name, checked } = event.detail;
		if (checked) {
			checkedOff.add(name);
		} else {
			checkedOff.delete(name);
		}
	}

	/** `ratingChange` from <rating-stars>. */
	function handleRatingChange(event: CustomEvent<RatingChangeDetail>) {
		if (!recipe) return;
		ratings.set(recipe.id, event.detail.value);
		toasts.success(
			event.detail.value === 0
				? 'Rating cleared.'
				: `Rated "${recipe.name}" ${event.detail.value} out of 5.`
		);
	}

	function toggleFavorite() {
		if (!recipe) return;
		const nowFavorite = favorites.toggle(recipe);
		toasts.success(
			nowFavorite ? `Added "${recipe.name}" to favourites.` : `Removed "${recipe.name}" from favourites.`
		);
	}

	function confirmAddToPlan() {
		if (!recipe) return;

		const existing = mealPlan.get(planDay, planMeal);
		mealPlan.assign(planDay, planMeal, recipe);
		planOpen = false;

		toasts.success(
			existing
				? `Replaced ${planMeal.toLowerCase()} on ${planDay} with "${recipe.name}".`
				: `Added "${recipe.name}" to ${planDay} ${planMeal.toLowerCase()}.`,
			{ label: 'View plan', run: () => goto('/planner') }
		);
	}

	function confirmDelete() {
		if (!recipe) return;

		const name = recipe.name;
		const removedFromPlan = mealPlan.removeRecipeEverywhere(recipe.id);
		favorites.remove(recipe.id);
		ratings.remove(recipe.id);
		myRecipes.remove(recipe.id);

		deleteOpen = false;
		void goto('/my-recipes');

		toasts.success(
			removedFromPlan > 0
				? `Deleted "${name}" and removed it from ${removedFromPlan} planned ${removedFromPlan === 1 ? 'meal' : 'meals'}.`
				: `Deleted "${name}".`
		);
	}

	/** Where in the week this recipe is already scheduled. */
	const scheduledIn = $derived.by(() => {
		if (!recipe) return [];
		const slots: string[] = [];
		for (const day of DAYS) {
			for (const meal of MEALS) {
				if (mealPlan.get(day, meal)?.recipeId === recipe.id) {
					slots.push(`${day} ${meal.toLowerCase()}`);
				}
			}
		}
		return slots;
	});
</script>

<svelte:head>
	<title>{recipe ? `${recipe.name} · Recipe Finder` : 'Recipe not found'}</title>
</svelte:head>

{#if !recipe}
	<div class="page">
		<EmptyState
			icon="🫙"
			title="Recipe not found"
			description="It may have been deleted from this browser."
		>
			<a class="btn btn-primary" href="/">Back to discover</a>
		</EmptyState>
	</div>
{:else}
	<div class="page stack">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href={isMine ? '/my-recipes' : '/'}>{isMine ? 'My recipes' : 'Discover'}</a>
			<span aria-hidden="true">/</span>
			<span class="muted">{recipe.name}</span>
		</nav>

		<article class="detail">
			<div class="hero-media">
				{#if recipe.image}
					<img src={recipe.image} alt={recipe.name} width="640" height="480" />
				{:else}
					<div class="media-fallback" aria-hidden="true">{recipe.name.charAt(0)}</div>
				{/if}
			</div>

			<header class="hero-text">
				<div class="chips">
					<span class="chip">{recipe.category}</span>
					<span class="chip chip-muted">{recipe.area}</span>
					{#if isMine}
						<span class="chip">Your recipe</span>
					{/if}
				</div>

				<h1>{recipe.name}</h1>

				{#if recipe.tags.length > 0}
					<ul class="tags">
						{#each recipe.tags as tag (tag)}
							<li>#{tag}</li>
						{/each}
					</ul>
				{/if}

				<div class="rating-row">
					<span class="field-label">Your rating</span>
					<!-- <rating-stars> in interactive mode; the value flows back as an event. -->
					<rating-stars
						value={myRating}
						size="24"
						show-value={myRating > 0}
						label="Rate this recipe"
						onratingChange={handleRatingChange}
					></rating-stars>
					{#if myRating > 0}
						<button class="btn btn-sm btn-ghost" type="button" onclick={() => ratings.remove(recipe.id)}>
							Clear
						</button>
					{/if}
				</div>

				<div class="actions">
					<button
						class="btn"
						class:btn-primary={!isFavorite}
						type="button"
						aria-pressed={isFavorite}
						onclick={toggleFavorite}
					>
						{isFavorite ? '♥ Saved to favourites' : '♡ Save to favourites'}
					</button>

					<button class="btn" type="button" onclick={() => (planOpen = true)}>
						Add to meal plan
					</button>

					{#if isMine}
						<a class="btn" href="/my-recipes/{recipe.id}/edit">Edit</a>
						<button class="btn btn-danger" type="button" onclick={() => (deleteOpen = true)}>
							Delete
						</button>
					{/if}
				</div>

				{#if scheduledIn.length > 0}
					<p class="scheduled muted">
						Already planned for {scheduledIn.join(', ')}.
						<a href="/planner">Open planner</a>
					</p>
				{/if}
			</header>
		</article>

		<div class="columns">
			<aside class="panel ingredients">
				<!--
					`items` is set as a DOM property in the effect above, not as an
					attribute. `checkable` and `columns` are primitives, so they pass
					as attributes. The default slot below is projected into the
					component's footer.
				-->
				<ingredient-list
					bind:this={ingredientListEl}
					heading="Ingredients"
					checkable
					oningredientCheck={handleIngredientCheck}
				>
					<p class="ingredient-note muted">
						{checkedOff.size === recipe.ingredients.length && recipe.ingredients.length > 0
							? 'Everything ticked off — you are ready to cook.'
							: 'Tick items off as you gather them.'}
					</p>
				</ingredient-list>
			</aside>

			<section class="panel instructions">
				<h2>Instructions</h2>

				{#if steps.length === 0}
					<p class="muted">No instructions were provided for this recipe.</p>
				{:else}
					<ol class="steps">
						{#each steps as step, index (index)}
							<li>
								<span class="step-number" aria-hidden="true">{index + 1}</span>
								<p>{step}</p>
							</li>
						{/each}
					</ol>
				{/if}

				{#if recipe.youtube || recipe.source}
					<div class="external">
						{#if recipe.youtube}
							<a class="btn btn-sm" href={recipe.youtube} target="_blank" rel="noreferrer noopener">
								Watch on YouTube
							</a>
						{/if}
						{#if recipe.source}
							<a class="btn btn-sm" href={recipe.source} target="_blank" rel="noreferrer noopener">
								Original source
							</a>
						{/if}
					</div>
				{/if}
			</section>
		</div>
	</div>

	<!--
		<modal-dialog> wraps the native <dialog> element. `open` stays owned by
		this page: the component only *requests* a close via `dialogClose`.
		Header content and the footer actions are passed through named slots.
	-->
	<modal-dialog
		open={planOpen}
		heading="Add to your week"
		subheading={recipe.name}
		ondialogClose={() => (planOpen = false)}
	>
		<div class="plan-form">
			<div class="field">
				<label for="plan-day">Day</label>
				<select id="plan-day" bind:value={planDay}>
					{#each DAYS as day (day)}
						<option value={day}>{day}</option>
					{/each}
				</select>
			</div>

			<div class="field">
				<label for="plan-meal">Meal</label>
				<select id="plan-meal" bind:value={planMeal}>
					{#each MEALS as meal (meal)}
						<option value={meal}>{meal}</option>
					{/each}
				</select>
			</div>
		</div>

		{#if mealPlan.get(planDay, planMeal)}
			<p class="replace-warning">
				{planDay} {planMeal.toLowerCase()} currently holds
				<strong>{mealPlan.get(planDay, planMeal)?.name}</strong>. Saving will replace it.
			</p>
		{/if}

		<div slot="footer">
			<button class="btn" type="button" onclick={() => (planOpen = false)}>Cancel</button>
			<button class="btn btn-primary" type="button" onclick={confirmAddToPlan}>
				Add to plan
			</button>
		</div>
	</modal-dialog>

	<modal-dialog
		open={deleteOpen}
		heading="Delete this recipe?"
		subheading={recipe.name}
		width="440px"
		ondialogClose={() => (deleteOpen = false)}
	>
		<p>
			This removes the recipe from this browser permanently, along with its favourite status and any
			place it appears in your weekly plan. It cannot be undone.
		</p>

		<div slot="footer">
			<button class="btn" type="button" onclick={() => (deleteOpen = false)}>Keep it</button>
			<button class="btn btn-danger" type="button" onclick={confirmDelete}>Delete recipe</button>
		</div>
	</modal-dialog>
{/if}

<style>
	.breadcrumb {
		display: flex;
		gap: var(--ru-space-2);
		font-size: var(--ru-font-size-sm);
		align-items: center;
	}

	.breadcrumb span:last-child {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.detail {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		gap: var(--ru-space-5);
		align-items: start;
	}

	.hero-media {
		border-radius: var(--ru-radius-lg);
		overflow: hidden;
		background: var(--surface);
		border: 1px solid var(--border);
		box-shadow: var(--ru-shadow-sm);
	}

	.hero-media img {
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
	}

	.media-fallback {
		display: grid;
		place-items: center;
		aspect-ratio: 4 / 3;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 4rem;
		font-weight: 700;
	}

	.hero-text {
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-3);
	}

	.chips,
	.tags,
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--ru-space-2);
	}

	.tags {
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--ru-font-size-sm);
		color: var(--text-muted);
	}

	.rating-row {
		display: flex;
		align-items: center;
		gap: var(--ru-space-3);
		padding: var(--ru-space-3) 0;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
	}

	.scheduled {
		font-size: var(--ru-font-size-sm);
	}

	.columns {
		display: grid;
		grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
		gap: var(--ru-space-4);
		align-items: start;
	}

	.ingredients {
		position: sticky;
		top: 84px;
	}

	.ingredient-note {
		font-size: var(--ru-font-size-sm);
		margin: 0;
	}

	.instructions h2 {
		margin-bottom: var(--ru-space-3);
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-4);
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: step;
	}

	.steps li {
		display: flex;
		gap: var(--ru-space-3);
		align-items: flex-start;
	}

	.step-number {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 27px;
		height: 27px;
		border-radius: 50%;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: var(--ru-font-size-sm);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.steps p {
		margin: 0;
		padding-top: 2px;
	}

	.external {
		display: flex;
		gap: var(--ru-space-2);
		flex-wrap: wrap;
		margin-top: var(--ru-space-5);
		padding-top: var(--ru-space-4);
		border-top: 1px solid var(--border);
	}

	.plan-form {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--ru-space-3);
	}

	.replace-warning {
		margin-top: var(--ru-space-3);
		padding: 10px 12px;
		border-radius: var(--ru-radius-sm);
		background: color-mix(in srgb, var(--ru-color-star) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--ru-color-star) 35%, transparent);
		font-size: var(--ru-font-size-sm);
	}

	@media (max-width: 900px) {
		.detail,
		.columns {
			grid-template-columns: minmax(0, 1fr);
		}

		.ingredients {
			position: static;
		}
	}
</style>
