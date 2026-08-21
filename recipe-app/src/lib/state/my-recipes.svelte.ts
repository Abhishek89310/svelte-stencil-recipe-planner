import type { Ingredient, Recipe } from '$lib/types';
import { readJSON, writeJSON, STORAGE_KEYS } from '$lib/storage';

/** The fields a user actually fills in; ids and timestamps are assigned here. */
export interface RecipeDraft {
	name: string;
	category: string;
	area: string;
	instructions: string;
	image: string;
	tags: string[];
	ingredients: Ingredient[];
	source?: string;
	youtube?: string;
}

/** Ids of user recipes carry this prefix so they can never collide with an API id. */
export const LOCAL_ID_PREFIX = 'local-';

export function isLocalRecipeId(id: string): boolean {
	return id.startsWith(LOCAL_ID_PREFIX);
}

function createId(): string {
	// randomUUID needs a secure context; fall back so http:// dev hosts still work.
	const unique =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

	return `${LOCAL_ID_PREFIX}${unique}`;
}

/**
 * Recipes the user has written themselves: the create / edit / delete side of
 * the app. API recipes are read-only, so everything here is keyed on the
 * `local-` id prefix, which is what lets the details page decide whether to
 * show edit controls without a second lookup.
 */
class MyRecipesStore {
	#items = $state<Recipe[]>(readJSON<Recipe[]>(STORAGE_KEYS.myRecipes, []));

	constructor() {
		$effect.root(() => {
			$effect(() => {
				writeJSON(STORAGE_KEYS.myRecipes, this.#items);
			});
		});
	}

	/** Newest first. */
	get items(): Recipe[] {
		return this.#items;
	}

	get count(): number {
		return this.#items.length;
	}

	get(id: string): Recipe | undefined {
		return this.#items.find((recipe) => recipe.id === id);
	}

	create(draft: RecipeDraft): Recipe {
		const now = new Date().toISOString();

		const recipe: Recipe = {
			...draft,
			id: createId(),
			origin: 'local',
			createdAt: now,
			updatedAt: now
		};

		this.#items = [recipe, ...this.#items];
		return recipe;
	}

	/** Applies a draft to an existing recipe. Returns `undefined` for unknown ids. */
	update(id: string, draft: RecipeDraft): Recipe | undefined {
		const existing = this.get(id);
		if (!existing) return undefined;

		const updated: Recipe = {
			...existing,
			...draft,
			updatedAt: new Date().toISOString()
		};

		this.#items = this.#items.map((recipe) => (recipe.id === id ? updated : recipe));
		return updated;
	}

	/** Removes a recipe. Returns whether anything was actually removed. */
	remove(id: string): boolean {
		const before = this.#items.length;
		this.#items = this.#items.filter((recipe) => recipe.id !== id);
		return this.#items.length !== before;
	}

	/** Case-insensitive name search across the user's own recipes. */
	search(query: string): Recipe[] {
		const needle = query.trim().toLowerCase();
		if (!needle) return this.#items;
		return this.#items.filter(
			(recipe) =>
				recipe.name.toLowerCase().includes(needle) ||
				recipe.category.toLowerCase().includes(needle) ||
				recipe.tags.some((tag) => tag.toLowerCase().includes(needle))
		);
	}
}

export const myRecipes = new MyRecipesStore();
