import { DAYS, MEALS, type Day, type Meal, type MealPlan, type PlannedMeal } from '$lib/types';
import type { Recipe, RecipeSummary } from '$lib/types';
import { readJSON, writeJSON, STORAGE_KEYS } from '$lib/storage';

/**
 * The weekly meal plan.
 *
 * The plan is a sparse `day -> meal -> PlannedMeal` map rather than a 7x3 array:
 * an unplanned cell is simply an absent key, which keeps the persisted JSON
 * small and makes "is this slot empty?" a plain undefined check.
 *
 * Like favourites, each planned meal stores the name and thumbnail it needs to
 * render, so the planner never waits on the network to draw a week.
 */
class MealPlanStore {
	#plan = $state<MealPlan>(readJSON<MealPlan>(STORAGE_KEYS.mealPlan, {}));

	constructor() {
		$effect.root(() => {
			$effect(() => {
				writeJSON(STORAGE_KEYS.mealPlan, this.#plan);
			});
		});
	}

	get plan(): MealPlan {
		return this.#plan;
	}

	/** How many of the 21 cells are filled. */
	get plannedCount(): number {
		return DAYS.reduce(
			(total, day) => total + MEALS.filter((meal) => this.#plan[day]?.[meal]).length,
			0
		);
	}

	/** Distinct recipes across the week, used for the shopping-list summary. */
	get uniqueRecipeIds(): string[] {
		const ids = new Set<string>();
		for (const day of DAYS) {
			for (const meal of MEALS) {
				const entry = this.#plan[day]?.[meal];
				if (entry) ids.add(entry.recipeId);
			}
		}
		return [...ids];
	}

	get(day: Day, meal: Meal): PlannedMeal | undefined {
		return this.#plan[day]?.[meal];
	}

	/** Assigns a recipe to a cell, replacing whatever was there. */
	assign(day: Day, meal: Meal, recipe: Recipe | RecipeSummary): void {
		const entry: PlannedMeal = {
			recipeId: recipe.id,
			name: recipe.name,
			image: recipe.image,
			meta: recipe.category ?? recipe.area ?? '',
			origin: recipe.origin,
			addedAt: new Date().toISOString()
		};

		// Replace the whole object rather than mutating in place: a new reference
		// is what tells the persistence effect that something changed.
		this.#plan = {
			...this.#plan,
			[day]: { ...this.#plan[day], [meal]: entry }
		};
	}

	remove(day: Day, meal: Meal): void {
		const dayPlan = { ...this.#plan[day] };
		delete dayPlan[meal];

		const next = { ...this.#plan };
		if (Object.keys(dayPlan).length === 0) {
			delete next[day];
		} else {
			next[day] = dayPlan;
		}

		this.#plan = next;
	}

	/** Moves a planned meal between cells, used by planner drag-and-drop. */
	move(from: { day: Day; meal: Meal }, to: { day: Day; meal: Meal }): void {
		const entry = this.get(from.day, from.meal);
		if (!entry) return;
		if (from.day === to.day && from.meal === to.meal) return;

		this.remove(from.day, from.meal);
		this.#plan = {
			...this.#plan,
			[to.day]: { ...this.#plan[to.day], [to.meal]: { ...entry } }
		};
	}

	/** Empties a single day. */
	clearDay(day: Day): void {
		const next = { ...this.#plan };
		delete next[day];
		this.#plan = next;
	}

	/** Empties the whole week. */
	clearAll(): void {
		this.#plan = {};
	}

	/** Removes every cell holding `recipeId`, e.g. after the recipe is deleted. */
	removeRecipeEverywhere(recipeId: string): number {
		let removed = 0;
		const next: MealPlan = {};

		for (const day of DAYS) {
			const dayPlan = this.#plan[day];
			if (!dayPlan) continue;

			const keptMeals: Partial<Record<Meal, PlannedMeal>> = {};
			for (const meal of MEALS) {
				const entry = dayPlan[meal];
				if (!entry) continue;
				if (entry.recipeId === recipeId) {
					removed += 1;
				} else {
					keptMeals[meal] = entry;
				}
			}

			if (Object.keys(keptMeals).length > 0) next[day] = keptMeals;
		}

		if (removed > 0) this.#plan = next;
		return removed;
	}
}

export const mealPlan = new MealPlanStore();
