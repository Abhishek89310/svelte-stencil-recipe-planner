import { browser } from '$app/environment';

/**
 * Namespaced, SSR-safe localStorage helpers.
 *
 * Every read is defensive: a user can edit localStorage by hand, a previous
 * version of the app may have written a different shape, and Safari's private
 * mode throws on write. None of those should take the page down, so failures
 * fall back to the caller's default and log rather than propagate.
 */
const PREFIX = 'recipe-planner';

export const STORAGE_KEYS = {
	favorites: `${PREFIX}:favorites`,
	myRecipes: `${PREFIX}:my-recipes`,
	mealPlan: `${PREFIX}:meal-plan`,
	ratings: `${PREFIX}:ratings`
} as const;

export function readJSON<T>(key: string, fallback: T): T {
	if (!browser) return fallback;

	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return fallback;
		const parsed = JSON.parse(raw);
		return (parsed ?? fallback) as T;
	} catch (error) {
		console.warn(`[storage] Could not read "${key}", using the default.`, error);
		return fallback;
	}
}

export function writeJSON(key: string, value: unknown): void {
	if (!browser) return;

	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		// Most likely a full quota or a private-mode restriction. The in-memory
		// state is still correct, so the session continues without persistence.
		console.warn(`[storage] Could not persist "${key}".`, error);
	}
}

export function removeKey(key: string): void {
	if (!browser) return;

	try {
		localStorage.removeItem(key);
	} catch (error) {
		console.warn(`[storage] Could not remove "${key}".`, error);
	}
}
