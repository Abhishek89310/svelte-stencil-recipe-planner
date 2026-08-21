import { readJSON, writeJSON, STORAGE_KEYS } from '$lib/storage';

/**
 * The user's personal 0-5 rating per recipe, keyed by recipe id.
 *
 * These are local notes, not a shared score: TheMealDB has no rating endpoint,
 * so nothing is ever sent anywhere. Kept in its own store rather than folded
 * into favourites, because rating a recipe and saving it are separate acts.
 */
class RatingsStore {
	#values = $state<Record<string, number>>(readJSON<Record<string, number>>(STORAGE_KEYS.ratings, {}));

	constructor() {
		$effect.root(() => {
			$effect(() => {
				writeJSON(STORAGE_KEYS.ratings, this.#values);
			});
		});
	}

	/** 0 means "not rated yet". */
	get(recipeId: string): number {
		return this.#values[recipeId] ?? 0;
	}

	set(recipeId: string, value: number): void {
		const clamped = Math.min(5, Math.max(0, Math.round(value)));

		if (clamped === 0) {
			const next = { ...this.#values };
			delete next[recipeId];
			this.#values = next;
			return;
		}

		this.#values = { ...this.#values, [recipeId]: clamped };
	}

	remove(recipeId: string): void {
		this.set(recipeId, 0);
	}
}

export const ratings = new RatingsStore();
