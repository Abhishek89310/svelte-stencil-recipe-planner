import type { RecipeDraft } from '$lib/state/my-recipes.svelte';

/** Field name -> message. An empty object means the draft is valid. */
export type ValidationErrors = Partial<Record<keyof RecipeDraft | 'form', string>>;

export const LIMITS = {
	nameMin: 3,
	nameMax: 80,
	categoryMax: 40,
	areaMax: 40,
	instructionsMin: 20,
	instructionsMax: 5000,
	ingredientsMin: 1,
	ingredientsMax: 40,
	tagsMax: 8
} as const;

/**
 * Accept only http(s) URLs.
 *
 * `new URL()` alone would happily accept `javascript:alert(1)`, which would then
 * be written straight into an `<img src>` or an `<a href>`, so the protocol
 * check is the point of this helper rather than an afterthought.
 */
export function isSafeHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

/**
 * Validates a recipe draft before it is saved.
 *
 * Runs entirely on the client because that is where the data lives; the same
 * function backs both the create and the edit form so the two can never drift.
 */
export function validateRecipe(draft: RecipeDraft): ValidationErrors {
	const errors: ValidationErrors = {};

	const name = draft.name.trim();
	if (!name) {
		errors.name = 'A recipe name is required.';
	} else if (name.length < LIMITS.nameMin) {
		errors.name = `The name must be at least ${LIMITS.nameMin} characters.`;
	} else if (name.length > LIMITS.nameMax) {
		errors.name = `The name must be ${LIMITS.nameMax} characters or fewer.`;
	}

	const category = draft.category.trim();
	if (!category) {
		errors.category = 'Pick or type a category.';
	} else if (category.length > LIMITS.categoryMax) {
		errors.category = `The category must be ${LIMITS.categoryMax} characters or fewer.`;
	}

	const area = draft.area.trim();
	if (area.length > LIMITS.areaMax) {
		errors.area = `The cuisine must be ${LIMITS.areaMax} characters or fewer.`;
	}

	const instructions = draft.instructions.trim();
	if (!instructions) {
		errors.instructions = 'Add the cooking instructions.';
	} else if (instructions.length < LIMITS.instructionsMin) {
		errors.instructions = `Instructions must be at least ${LIMITS.instructionsMin} characters.`;
	} else if (instructions.length > LIMITS.instructionsMax) {
		errors.instructions = `Instructions must be ${LIMITS.instructionsMax} characters or fewer.`;
	}

	const filledIngredients = draft.ingredients.filter((item) => item.name.trim().length > 0);
	if (filledIngredients.length < LIMITS.ingredientsMin) {
		errors.ingredients = 'Add at least one ingredient.';
	} else if (filledIngredients.length > LIMITS.ingredientsMax) {
		errors.ingredients = `A recipe can have at most ${LIMITS.ingredientsMax} ingredients.`;
	} else {
		const seen = new Set<string>();
		const duplicate = filledIngredients.find((item) => {
			const key = item.name.trim().toLowerCase();
			if (seen.has(key)) return true;
			seen.add(key);
			return false;
		});
		if (duplicate) {
			errors.ingredients = `"${duplicate.name.trim()}" is listed more than once.`;
		}
	}

	const image = draft.image.trim();
	if (image && !isSafeHttpUrl(image)) {
		errors.image = 'Enter a full image URL starting with http:// or https://';
	}

	const source = draft.source?.trim();
	if (source && !isSafeHttpUrl(source)) {
		errors.source = 'Enter a full URL starting with http:// or https://';
	}

	const youtube = draft.youtube?.trim();
	if (youtube && !isSafeHttpUrl(youtube)) {
		errors.youtube = 'Enter a full URL starting with http:// or https://';
	}

	if (draft.tags.length > LIMITS.tagsMax) {
		errors.tags = `Use at most ${LIMITS.tagsMax} tags.`;
	}

	return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
	return Object.keys(errors).length > 0;
}

/**
 * Normalises a draft into exactly what gets stored: trimmed strings, blank
 * ingredient rows dropped, and tags de-duplicated. Call this only after
 * `validateRecipe` reports no errors.
 */
export function normalizeDraft(draft: RecipeDraft): RecipeDraft {
	const seenTags = new Set<string>();

	return {
		name: draft.name.trim(),
		category: draft.category.trim(),
		area: draft.area.trim() || 'International',
		instructions: draft.instructions.trim(),
		image: draft.image.trim(),
		source: draft.source?.trim() || undefined,
		youtube: draft.youtube?.trim() || undefined,
		ingredients: draft.ingredients
			.filter((item) => item.name.trim().length > 0)
			.map((item) => ({ name: item.name.trim(), measure: item.measure.trim() })),
		tags: draft.tags
			.map((tag) => tag.trim())
			.filter((tag) => {
				const key = tag.toLowerCase();
				if (!tag || seenTags.has(key)) return false;
				seenTags.add(key);
				return true;
			})
	};
}

/** A blank draft with one empty ingredient row, so the form starts usable. */
export function emptyDraft(): RecipeDraft {
	return {
		name: '',
		category: '',
		area: '',
		instructions: '',
		image: '',
		tags: [],
		ingredients: [{ name: '', measure: '' }]
	};
}
