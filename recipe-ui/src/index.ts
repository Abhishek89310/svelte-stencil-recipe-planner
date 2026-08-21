/**
 * Public entry point of @iosdev_89/recipe-ui.
 *
 * Importing the package for its side effects registers every custom element;
 * the named exports below are the TypeScript payload types carried by each
 * component's CustomEvent, so consumers can type their listeners.
 */
export { Components, JSX } from './components';

export type { RecipeSelectDetail, FavoriteToggleDetail } from './components/recipe-card/recipe-card';
export type { SearchDetail } from './components/recipe-search-bar/recipe-search-bar';
export type { RatingChangeDetail } from './components/rating-stars/rating-stars';
export type { Ingredient, IngredientCheckDetail } from './components/ingredient-list/ingredient-list';
export type { MealSlotDetail, MealDropDetail } from './components/meal-slot/meal-slot';
