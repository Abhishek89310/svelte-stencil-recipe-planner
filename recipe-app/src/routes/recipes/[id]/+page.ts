import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getRecipeById, RecipeApiError } from '$lib/api/themealdb';
import { isLocalRecipeId } from '$lib/state/my-recipes.svelte';

/**
 * Loads the recipe for the details page.
 *
 * Only API recipes are fetched here. A user-created recipe lives in a reactive
 * store, so resolving it in the component instead keeps the page in step when
 * the recipe is edited without forcing a navigation.
 */
export const load: PageLoad = async ({ params }) => {
	if (isLocalRecipeId(params.id)) {
		return { id: params.id, apiRecipe: null };
	}

	try {
		const apiRecipe = await getRecipeById(params.id);
		if (!apiRecipe) {
			error(404, 'That recipe could not be found.');
		}
		return { id: params.id, apiRecipe };
	} catch (cause) {
		if (cause instanceof RecipeApiError) {
			error(cause.status ?? 503, cause.message);
		}
		throw cause;
	}
};
