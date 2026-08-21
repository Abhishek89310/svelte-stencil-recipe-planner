import type { Ingredient, Recipe, RecipeSummary } from '$lib/types';

/**
 * Client for TheMealDB's free public API.
 *
 * The `1` in the path is the shared developer key that the service publishes for
 * open use, so no signup, secret or server proxy is involved. Every call happens
 * from the browser.
 *
 * The API has two response shapes: `lookup`/`search` return full meals, while
 * `filter` returns id + name + thumbnail only. Those are normalised into
 * `Recipe` and `RecipeSummary` respectively, and the difference is preserved in
 * the types rather than papered over with empty strings.
 */
const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

/** Raw meal record as it arrives from the API. */
interface RawMeal {
	idMeal: string;
	strMeal: string;
	strCategory?: string | null;
	strArea?: string | null;
	strInstructions?: string | null;
	strMealThumb?: string | null;
	strTags?: string | null;
	strYoutube?: string | null;
	strSource?: string | null;
	[key: string]: string | null | undefined;
}

interface MealsResponse {
	meals: RawMeal[] | null;
}

/** Raised for any non-2xx response or network failure, with a readable message. */
export class RecipeApiError extends Error {
	constructor(
		message: string,
		readonly status?: number
	) {
		super(message);
		this.name = 'RecipeApiError';
	}
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
	let response: Response;

	try {
		response = await fetch(`${BASE_URL}${path}`, { signal });
	} catch (error) {
		// An aborted request is a normal part of debounced searching, not a failure,
		// so let it propagate untouched for the caller to ignore.
		if (error instanceof DOMException && error.name === 'AbortError') throw error;
		throw new RecipeApiError(
			'Could not reach the recipe service. Check your internet connection and try again.'
		);
	}

	if (!response.ok) {
		throw new RecipeApiError(
			`The recipe service responded with ${response.status}. Please try again in a moment.`,
			response.status
		);
	}

	return (await response.json()) as T;
}

/**
 * Collapse TheMealDB's `strIngredient1..20` / `strMeasure1..20` column pairs into
 * a list, dropping the blank trailing slots that every record carries.
 */
function extractIngredients(meal: RawMeal): Ingredient[] {
	const ingredients: Ingredient[] = [];

	for (let i = 1; i <= 20; i += 1) {
		const name = meal[`strIngredient${i}`]?.trim();
		const measure = meal[`strMeasure${i}`]?.trim();
		if (name) {
			ingredients.push({ name, measure: measure ?? '' });
		}
	}

	return ingredients;
}

function normalizeMeal(meal: RawMeal): Recipe {
	return {
		id: meal.idMeal,
		name: meal.strMeal,
		category: meal.strCategory?.trim() || 'Uncategorised',
		area: meal.strArea?.trim() || 'International',
		instructions: meal.strInstructions?.trim() ?? '',
		image: meal.strMealThumb?.trim() ?? '',
		tags: (meal.strTags ?? '')
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean),
		ingredients: extractIngredients(meal),
		origin: 'api',
		youtube: meal.strYoutube?.trim() || undefined,
		source: meal.strSource?.trim() || undefined
	};
}

function normalizeSummary(meal: RawMeal): RecipeSummary {
	return {
		id: meal.idMeal,
		name: meal.strMeal,
		image: meal.strMealThumb?.trim() ?? '',
		// filter.php omits these; leaving them undefined is more honest than ''.
		category: meal.strCategory?.trim() || undefined,
		area: meal.strArea?.trim() || undefined,
		origin: 'api'
	};
}

/** Full-text search by recipe name. Returns `[]` when nothing matches. */
export async function searchRecipes(query: string, signal?: AbortSignal): Promise<Recipe[]> {
	const data = await request<MealsResponse>(
		`/search.php?s=${encodeURIComponent(query.trim())}`,
		signal
	);
	return (data.meals ?? []).map(normalizeMeal);
}

/** Recipes in a category, e.g. "Dessert". Summaries only. */
export async function filterByCategory(
	category: string,
	signal?: AbortSignal
): Promise<RecipeSummary[]> {
	const data = await request<MealsResponse>(
		`/filter.php?c=${encodeURIComponent(category)}`,
		signal
	);
	return (data.meals ?? []).map(normalizeSummary);
}

/** Recipes from a cuisine, e.g. "Italian". Summaries only. */
export async function filterByArea(area: string, signal?: AbortSignal): Promise<RecipeSummary[]> {
	const data = await request<MealsResponse>(`/filter.php?a=${encodeURIComponent(area)}`, signal);
	return (data.meals ?? []).map(normalizeSummary);
}

/** Recipes containing a main ingredient, e.g. "chicken_breast". Summaries only. */
export async function filterByIngredient(
	ingredient: string,
	signal?: AbortSignal
): Promise<RecipeSummary[]> {
	const data = await request<MealsResponse>(
		`/filter.php?i=${encodeURIComponent(ingredient)}`,
		signal
	);
	return (data.meals ?? []).map(normalizeSummary);
}

/** A single recipe with ingredients and instructions, or `null` if the id is unknown. */
export async function getRecipeById(id: string, signal?: AbortSignal): Promise<Recipe | null> {
	const data = await request<MealsResponse>(`/lookup.php?i=${encodeURIComponent(id)}`, signal);
	const meal = data.meals?.[0];
	return meal ? normalizeMeal(meal) : null;
}

/** One random recipe, used to seed the discover page before the user searches. */
export async function getRandomRecipe(signal?: AbortSignal): Promise<Recipe | null> {
	const data = await request<MealsResponse>('/random.php', signal);
	const meal = data.meals?.[0];
	return meal ? normalizeMeal(meal) : null;
}

/**
 * `count` distinct random recipes.
 *
 * The API has no bulk-random endpoint, so this fans out single calls and drops
 * duplicates. It over-fetches slightly and stops early rather than looping until
 * the exact count is reached, which would spin forever on a small catalogue.
 */
export async function getRandomRecipes(count: number, signal?: AbortSignal): Promise<Recipe[]> {
	const attempts = Array.from({ length: count + 3 }, () => getRandomRecipe(signal));
	const results = await Promise.allSettled(attempts);

	const seen = new Set<string>();
	const recipes: Recipe[] = [];

	for (const result of results) {
		if (result.status !== 'fulfilled' || !result.value) continue;
		if (seen.has(result.value.id)) continue;
		seen.add(result.value.id);
		recipes.push(result.value);
		if (recipes.length === count) break;
	}

	return recipes;
}

/**
 * Trim, drop blanks, and remove duplicates.
 *
 * The list endpoints are not clean: the area list ships "Dominican" twice, which
 * is enough to crash a keyed `{#each}` block. Normalising here means no caller
 * has to remember that.
 */
function uniqueSorted(values: (string | null | undefined)[]): string[] {
	const seen = new Set<string>();

	for (const value of values) {
		const name = value?.trim();
		if (name) seen.add(name);
	}

	return [...seen].sort((a, b) => a.localeCompare(b));
}

/** All category names offered by the API, de-duplicated and sorted. */
export async function listCategories(signal?: AbortSignal): Promise<string[]> {
	const data = await request<{ meals: { strCategory: string }[] | null }>(
		'/list.php?c=list',
		signal
	);
	return uniqueSorted((data.meals ?? []).map((entry) => entry.strCategory));
}

/** All cuisine/area names offered by the API, de-duplicated and sorted. */
export async function listAreas(signal?: AbortSignal): Promise<string[]> {
	const data = await request<{ meals: { strArea: string }[] | null }>('/list.php?a=list', signal);
	return uniqueSorted((data.meals ?? []).map((entry) => entry.strArea));
}
