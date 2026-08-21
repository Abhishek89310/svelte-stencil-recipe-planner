<script lang="ts">
	import type { Recipe, RecipeSummary } from '$lib/types';
	import type { FavoriteToggleDetail, RecipeSelectDetail } from '@iosdev_89/recipe-ui';
	import { goto } from '$app/navigation';
	import { favorites } from '$lib/state/favorites.svelte';
	import { toasts } from '$lib/state/toasts.svelte';

	interface Props {
		recipes: (Recipe | RecipeSummary)[];
		/** Renders the slimmer card variant, used in dense sidebars. */
		compact?: boolean;
		/** Makes each card draggable so it can be dropped onto a planner slot. */
		draggable?: boolean;
		/** Called instead of navigating, e.g. when the grid drives a picker dialog. */
		onselect?: (recipe: Recipe | RecipeSummary) => void;
	}

	let { recipes, compact = false, draggable = false, onselect }: Props = $props();

	/** Cards are keyed by id, so a lookup is needed to answer an event. */
	function find(id: string): Recipe | RecipeSummary | undefined {
		return recipes.find((recipe) => recipe.id === id);
	}

	/**
	 * `recipeSelect` from <recipe-card>. Svelte 5 keeps the case of an `on*`
	 * attribute, so `onrecipeSelect` maps to addEventListener('recipeSelect').
	 */
	function handleSelect(event: CustomEvent<RecipeSelectDetail>) {
		const recipe = find(event.detail.recipeId);
		if (!recipe) return;

		if (onselect) {
			onselect(recipe);
		} else {
			goto(`/recipes/${recipe.id}`);
		}
	}

	/** `favoriteToggle` from <recipe-card>, with an undo affordance. */
	function handleFavorite(event: CustomEvent<FavoriteToggleDetail>) {
		const recipe = find(event.detail.recipeId);
		if (!recipe) return;

		const nowFavorite = favorites.toggle(recipe);

		if (nowFavorite) {
			toasts.success(`Added "${recipe.name}" to favourites.`, {
				label: 'Undo',
				run: () => favorites.remove(recipe.id)
			});
		} else {
			toasts.info(`Removed "${recipe.name}" from favourites.`, {
				label: 'Undo',
				run: () => favorites.add(recipe)
			});
		}
	}

	/** Seeds the drag payload that <meal-slot> reads on drop. */
	function handleDragStart(event: DragEvent, recipe: Recipe | RecipeSummary) {
		event.dataTransfer?.setData('text/recipe-id', recipe.id);
		event.dataTransfer?.setData('text/plain', recipe.id);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
	}
</script>

<div class="card-grid">
	{#each recipes as recipe (recipe.id)}
		<div
			class="cell"
			draggable={draggable ? 'true' : 'false'}
			role={draggable ? 'application' : undefined}
			ondragstart={(event) => handleDragStart(event, recipe)}
		>
			<!--
				Data flows down as component properties and back up as custom events,
				which is the whole contract between SvelteKit and the Stencil library.
			-->
			<recipe-card
				recipe-id={recipe.id}
				name={recipe.name}
				image={recipe.image}
				category={recipe.category ?? ''}
				area={recipe.area ?? ''}
				tags={(recipe.tags ?? []).join(',')}
				favorite={favorites.has(recipe.id)}
				authored={recipe.origin === 'local'}
				compact={compact}
				onrecipeSelect={handleSelect}
				onfavoriteToggle={handleFavorite}
			>
				{#if draggable}
					<!-- Slotted content projected into the card's named "badge" slot. -->
					<span slot="badge" class="drag-badge">Drag to plan</span>
				{/if}
			</recipe-card>
		</div>
	{/each}
</div>

<style>
	.cell {
		height: 100%;
	}

	.cell[draggable='true'] {
		cursor: grab;
	}

	.cell[draggable='true']:active {
		cursor: grabbing;
	}

	.drag-badge {
		display: inline-block;
		padding: 2px 9px;
		border-radius: var(--ru-radius-pill);
		background: rgb(28 25 23 / 0.72);
		color: #fff;
		font-size: 0.6875rem;
		font-weight: 600;
		backdrop-filter: blur(4px);
	}
</style>
