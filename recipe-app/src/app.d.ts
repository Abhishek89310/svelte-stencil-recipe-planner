import type {
	FavoriteToggleDetail,
	IngredientCheckDetail,
	Ingredient,
	MealDropDetail,
	MealSlotDetail,
	RatingChangeDetail,
	RecipeSelectDetail,
	SearchDetail
} from '@abhishek/recipe-ui';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	/**
	 * Types for the custom elements from the `@abhishek/recipe-ui` npm package.
	 *
	 * Svelte cannot infer an API for an element it did not compile, so without
	 * these declarations every prop and every `on*` handler on a Stencil tag is
	 * untyped. Declaring them here means a typo in a prop name or the wrong
	 * `event.detail` shape is a `svelte-check` error rather than a silent no-op
	 * at runtime.
	 *
	 * Svelte 5 preserves the case of an `on*` attribute, so `onrecipeSelect`
	 * registers a listener for the `recipeSelect` event.
	 */
	namespace svelteHTML {
		type CustomEventHandler<T> = (event: CustomEvent<T>) => void;

		interface HTMLAttributes {
			slot?: string;
		}

		interface IntrinsicElements {
			'recipe-card': HTMLAttributes & {
				'recipe-id': string;
				name: string;
				image?: string;
				category?: string;
				area?: string;
				tags?: string;
				favorite?: boolean;
				rating?: number;
				authored?: boolean;
				compact?: boolean;
				onrecipeSelect?: CustomEventHandler<RecipeSelectDetail>;
				onfavoriteToggle?: CustomEventHandler<FavoriteToggleDetail>;
			};

			'recipe-search-bar': HTMLAttributes & {
				placeholder?: string;
				value?: string;
				debounce?: number;
				'submit-label'?: string;
				loading?: boolean;
				disabled?: boolean;
				onsearchInput?: CustomEventHandler<SearchDetail>;
				onsearchSubmit?: CustomEventHandler<SearchDetail>;
				onsearchClear?: CustomEventHandler<void>;
			};

			'rating-stars': HTMLAttributes & {
				value?: number;
				max?: number;
				readonly?: boolean;
				label?: string;
				'show-value'?: boolean;
				size?: number;
				onratingChange?: CustomEventHandler<RatingChangeDetail>;
			};

			'ingredient-list': HTMLAttributes & {
				/** Set as a DOM property for arrays; an attribute accepts JSON. */
				items?: Ingredient[] | string;
				heading?: string;
				checkable?: boolean;
				columns?: boolean;
				'bind:this'?: unknown;
				oningredientCheck?: CustomEventHandler<IngredientCheckDetail>;
			};

			'meal-slot': HTMLAttributes & {
				day: string;
				meal: string;
				'recipe-id'?: string;
				'recipe-name'?: string;
				'recipe-image'?: string;
				'recipe-meta'?: string;
				highlighted?: boolean;
				'drop-mime-type'?: string;
				onmealAssign?: CustomEventHandler<MealSlotDetail>;
				onmealRemove?: CustomEventHandler<MealSlotDetail>;
				onmealOpen?: CustomEventHandler<MealSlotDetail>;
				onmealDrop?: CustomEventHandler<MealDropDetail>;
			};

			'modal-dialog': HTMLAttributes & {
				open?: boolean;
				heading?: string;
				subheading?: string;
				'hide-close'?: boolean;
				persistent?: boolean;
				width?: string;
				ondialogClose?: CustomEventHandler<void>;
				ondialogOpen?: CustomEventHandler<void>;
			};
		}
	}
}

export {};
