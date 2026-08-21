import { browser } from '$app/environment';

/**
 * Registers the components from the published `@iosdev_89/recipe-ui` npm package.
 *
 * Two details matter here:
 *
 * 1. Custom element registration needs a real `window`, so the loader is
 *    imported dynamically and only in the browser. A static top-level import
 *    would break any server-side or build-time render.
 * 2. `customElements.define` throws if a tag is registered twice, and Vite's
 *    HMR re-runs modules freely. The promise below is memoised so registration
 *    happens exactly once per page load no matter how many components ask.
 */
let registration: Promise<void> | null = null;

export function registerRecipeUi(): Promise<void> {
	if (!browser) return Promise.resolve();

	registration ??= (async () => {
		const { defineCustomElements } = await import('@iosdev_89/recipe-ui/loader');
		await defineCustomElements(window);
	})();

	return registration;
}

/**
 * Resolves once every tag the app uses has been upgraded.
 *
 * Stencil's lazy loader defines the elements asynchronously, so a component that
 * sets a *property* (rather than an attribute) immediately after mount can win
 * the race and write to a plain HTMLElement. Awaiting this first is what makes
 * property passing reliable.
 */
const TAGS = [
	'recipe-card',
	'recipe-search-bar',
	'rating-stars',
	'ingredient-list',
	'meal-slot',
	'modal-dialog'
] as const;

export async function whenRecipeUiReady(): Promise<void> {
	if (!browser) return;
	await registerRecipeUi();
	await Promise.all(TAGS.map((tag) => customElements.whenDefined(tag)));
}
