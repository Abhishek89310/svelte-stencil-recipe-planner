/** A single ingredient line of a recipe. */
export interface Ingredient {
	name: string;
	measure: string;
}

/**
 * Where a recipe came from.
 * - `api`   - fetched from TheMealDB; read-only.
 * - `local` - created by the user in this browser; editable and deletable.
 */
export type RecipeOrigin = 'api' | 'local';

/**
 * The application's single recipe shape.
 *
 * TheMealDB returns a flat record with 20 numbered ingredient/measure pairs;
 * everything is normalised into this type at the edge (see `$lib/api/themealdb`)
 * so the rest of the app never deals with the wire format. User-created recipes
 * are built in the same shape, which is what lets one card, one details page and
 * one planner slot render both kinds without branching.
 */
export interface Recipe {
	id: string;
	name: string;
	category: string;
	area: string;
	instructions: string;
	image: string;
	tags: string[];
	ingredients: Ingredient[];
	origin: RecipeOrigin;
	youtube?: string;
	source?: string;
	/** ISO timestamps, present on user-created recipes only. */
	createdAt?: string;
	updatedAt?: string;
}

/**
 * The trimmed shape returned by TheMealDB's `filter.php` endpoints, which only
 * carry an id, a name and a thumbnail. Kept separate from `Recipe` so the type
 * system stops us reading a category that the endpoint never sent.
 */
export interface RecipeSummary {
	id: string;
	name: string;
	image: string;
	category?: string;
	area?: string;
	tags?: string[];
	origin: RecipeOrigin;
}

/** Days of the week, in planner order. */
export const DAYS = [
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
	'Sunday'
] as const;

export type Day = (typeof DAYS)[number];

/** Meal sittings within a planned day. */
export const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const;

export type Meal = (typeof MEALS)[number];

/** A recipe pinned to one day/meal cell of the weekly plan. */
export interface PlannedMeal {
	recipeId: string;
	name: string;
	image: string;
	meta: string;
	origin: RecipeOrigin;
	addedAt: string;
}

/** The weekly plan: `plan[day][meal]`, with missing keys meaning "empty". */
export type MealPlan = Partial<Record<Day, Partial<Record<Meal, PlannedMeal>>>>;

/** A favourited recipe, stored with enough detail to render a card offline. */
export interface FavoriteEntry {
	id: string;
	name: string;
	image: string;
	category: string;
	area: string;
	origin: RecipeOrigin;
	addedAt: string;
}
