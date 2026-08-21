import type { FavoriteEntry, Recipe, RecipeSummary } from '$lib/types';
import { readJSON, writeJSON, STORAGE_KEYS } from '$lib/storage';

/**
 * Favourites, held in a rune-backed class and mirrored to localStorage.
 *
 * A class instance exported as a singleton gives every route the same reactive
 * object without any subscribe/unsubscribe ceremony: reading `favorites.items`
 * inside a component registers the dependency, and any mutation re-renders every
 * reader. Persistence is a single `$effect.root` rather than a write inside each
 * method, so no code path can mutate the list and forget to save it.
 *
 * Entries are stored denormalised (name, image, category) so the favourites page
 * renders instantly and works offline, instead of re-fetching each recipe by id.
 */
class FavoritesStore {
	#items = $state<FavoriteEntry[]>(readJSON<FavoriteEntry[]>(STORAGE_KEYS.favorites, []));

	/** Lookup set kept in step with the list, so `has()` stays O(1) in big grids. */
	#ids = $derived(new Set(this.#items.map((entry) => entry.id)));

	constructor() {
		$effect.root(() => {
			$effect(() => {
				writeJSON(STORAGE_KEYS.favorites, this.#items);
			});
		});
	}

	/** Newest first. */
	get items(): FavoriteEntry[] {
		return this.#items;
	}

	get count(): number {
		return this.#items.length;
	}

	has(id: string): boolean {
		return this.#ids.has(id);
	}

	/** Adds a recipe, or does nothing if it is already favourited. */
	add(recipe: Recipe | RecipeSummary): void {
		if (this.has(recipe.id)) return;

		const entry: FavoriteEntry = {
			id: recipe.id,
			name: recipe.name,
			image: recipe.image,
			category: recipe.category ?? 'Uncategorised',
			area: recipe.area ?? 'International',
			origin: recipe.origin,
			addedAt: new Date().toISOString()
		};

		this.#items = [entry, ...this.#items];
	}

	remove(id: string): void {
		this.#items = this.#items.filter((entry) => entry.id !== id);
	}

	/** Adds or removes, and reports the state the recipe ended up in. */
	toggle(recipe: Recipe | RecipeSummary): boolean {
		if (this.has(recipe.id)) {
			this.remove(recipe.id);
			return false;
		}
		this.add(recipe);
		return true;
	}

	clear(): void {
		this.#items = [];
	}
}

export const favorites = new FavoritesStore();
