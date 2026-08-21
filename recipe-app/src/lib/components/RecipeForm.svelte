<script lang="ts">
	import type { RecipeDraft } from '$lib/state/my-recipes.svelte';
	import type { ValidationErrors } from '$lib/validation';
	import { LIMITS, hasErrors, normalizeDraft, validateRecipe } from '$lib/validation';

	interface Props {
		/** Starting values. The form works on a copy, so the caller's object is untouched. */
		initial: RecipeDraft;
		submitLabel?: string;
		/** Called with a normalised, already-validated draft. */
		onsave: (draft: RecipeDraft) => void;
		oncancel?: () => void;
		/** Category suggestions offered as a datalist. */
		categories?: string[];
		areas?: string[];
	}

	let {
		initial,
		submitLabel = 'Save recipe',
		onsave,
		oncancel,
		categories = [],
		areas = []
	}: Props = $props();

	// A deliberate one-time capture: the form owns an editable copy from the moment
	// it mounts, and `$state.snapshot` strips the proxy so typing here can never
	// write through to whatever the caller passed in. Routes remount the form when
	// the recipe changes, so there is nothing to keep in sync afterwards.
	// svelte-ignore state_referenced_locally
	let draft = $state<RecipeDraft>(structuredClone($state.snapshot(initial)));
	// svelte-ignore state_referenced_locally
	let tagInput = $state(initial.tags.join(', '));
	let errors = $state<ValidationErrors>({});
	/** Errors only appear once a field has been visited or the form submitted. */
	let touched = $state<Record<string, boolean>>({});
	let submitted = $state(false);

	const draftWithTags = $derived<RecipeDraft>({
		...draft,
		tags: tagInput
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean)
	});

	/** Live validation, so the submit button reflects the real state. */
	const liveErrors = $derived(validateRecipe(draftWithTags));
	const isValid = $derived(!hasErrors(liveErrors));

	function shouldShow(field: keyof ValidationErrors): boolean {
		return (submitted || touched[field]) && Boolean(liveErrors[field]);
	}

	function markTouched(field: string) {
		touched = { ...touched, [field]: true };
	}

	function addIngredient() {
		draft.ingredients = [...draft.ingredients, { name: '', measure: '' }];
	}

	function removeIngredient(index: number) {
		// Always leave one row, so the list can never become un-editable.
		draft.ingredients =
			draft.ingredients.length === 1
				? [{ name: '', measure: '' }]
				: draft.ingredients.filter((_, i) => i !== index);
	}

	function moveIngredient(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= draft.ingredients.length) return;

		const next = [...draft.ingredients];
		[next[index], next[target]] = [next[target], next[index]];
		draft.ingredients = next;
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
		errors = validateRecipe(draftWithTags);

		if (hasErrors(errors)) {
			// Move focus to the first problem so the error is not just visual.
			const firstField = Object.keys(errors)[0];
			document.getElementById(`field-${firstField}`)?.focus();
			return;
		}

		onsave(normalizeDraft(draftWithTags));
	}

	const imagePreview = $derived(
		draft.image.trim() && !liveErrors.image ? draft.image.trim() : ''
	);
</script>

<form class="recipe-form" onsubmit={handleSubmit} novalidate>
	<div class="panel section">
		<h2>The basics</h2>

		<div class="field">
			<label for="field-name">Recipe name <span class="required">*</span></label>
			<input
				id="field-name"
				type="text"
				bind:value={draft.name}
				onblur={() => markTouched('name')}
				aria-invalid={shouldShow('name')}
				aria-describedby={shouldShow('name') ? 'error-name' : undefined}
				maxlength={LIMITS.nameMax}
				placeholder="Grandma's banana bread"
				autocomplete="off"
			/>
			{#if shouldShow('name')}
				<p class="error-text" id="error-name">{liveErrors.name}</p>
			{/if}
		</div>

		<div class="row">
			<div class="field">
				<label for="field-category">Category <span class="required">*</span></label>
				<input
					id="field-category"
					type="text"
					list="category-options"
					bind:value={draft.category}
					onblur={() => markTouched('category')}
					aria-invalid={shouldShow('category')}
					aria-describedby={shouldShow('category') ? 'error-category' : undefined}
					placeholder="Dessert"
					autocomplete="off"
				/>
				<datalist id="category-options">
					{#each categories as name (name)}
						<option value={name}></option>
					{/each}
				</datalist>
				{#if shouldShow('category')}
					<p class="error-text" id="error-category">{liveErrors.category}</p>
				{/if}
			</div>

			<div class="field">
				<label for="field-area">Cuisine</label>
				<input
					id="field-area"
					type="text"
					list="area-options"
					bind:value={draft.area}
					onblur={() => markTouched('area')}
					aria-invalid={shouldShow('area')}
					placeholder="British"
					autocomplete="off"
				/>
				<datalist id="area-options">
					{#each areas as name (name)}
						<option value={name}></option>
					{/each}
				</datalist>
				<span class="hint">Defaults to “International” if left blank.</span>
				{#if shouldShow('area')}
					<p class="error-text">{liveErrors.area}</p>
				{/if}
			</div>
		</div>

		<div class="field">
			<label for="field-tags">Tags</label>
			<input
				id="field-tags"
				type="text"
				bind:value={tagInput}
				onblur={() => markTouched('tags')}
				placeholder="Quick, Vegetarian, Baking"
				autocomplete="off"
			/>
			<span class="hint">Comma separated, up to {LIMITS.tagsMax} tags.</span>
			{#if shouldShow('tags')}
				<p class="error-text">{liveErrors.tags}</p>
			{/if}
		</div>

		<div class="field">
			<label for="field-image">Image URL</label>
			<input
				id="field-image"
				type="url"
				bind:value={draft.image}
				onblur={() => markTouched('image')}
				aria-invalid={shouldShow('image')}
				placeholder="https://example.com/banana-bread.jpg"
			/>
			{#if shouldShow('image')}
				<p class="error-text">{liveErrors.image}</p>
			{/if}
			{#if imagePreview}
				<img class="preview" src={imagePreview} alt="Preview of the recipe" />
			{/if}
		</div>
	</div>

	<div class="panel section">
		<div class="section-head">
			<h2>Ingredients <span class="required">*</span></h2>
			<span class="muted count">{draft.ingredients.filter((i) => i.name.trim()).length} added</span>
		</div>

		<ul class="ingredient-rows" id="field-ingredients">
			{#each draft.ingredients as ingredient, index (index)}
				<li class="ingredient-row">
					<span class="row-index" aria-hidden="true">{index + 1}</span>

					<input
						type="text"
						placeholder="Ingredient"
						bind:value={ingredient.name}
						onblur={() => markTouched('ingredients')}
						aria-label="Ingredient {index + 1} name"
					/>

					<input
						type="text"
						placeholder="Amount"
						bind:value={ingredient.measure}
						aria-label="Ingredient {index + 1} amount"
					/>

					<div class="row-controls">
						<button
							class="icon-btn"
							type="button"
							title="Move up"
							aria-label="Move ingredient {index + 1} up"
							disabled={index === 0}
							onclick={() => moveIngredient(index, -1)}
						>
							↑
						</button>
						<button
							class="icon-btn"
							type="button"
							title="Move down"
							aria-label="Move ingredient {index + 1} down"
							disabled={index === draft.ingredients.length - 1}
							onclick={() => moveIngredient(index, 1)}
						>
							↓
						</button>
						<button
							class="icon-btn icon-danger"
							type="button"
							title="Remove"
							aria-label="Remove ingredient {index + 1}"
							onclick={() => removeIngredient(index)}
						>
							×
						</button>
					</div>
				</li>
			{/each}
		</ul>

		{#if shouldShow('ingredients')}
			<p class="error-text">{liveErrors.ingredients}</p>
		{/if}

		<button
			class="btn btn-sm"
			type="button"
			onclick={addIngredient}
			disabled={draft.ingredients.length >= LIMITS.ingredientsMax}
		>
			+ Add ingredient
		</button>
	</div>

	<div class="panel section">
		<h2>Instructions <span class="required">*</span></h2>

		<div class="field">
			<label class="visually-hidden" for="field-instructions">Cooking instructions</label>
			<textarea
				id="field-instructions"
				bind:value={draft.instructions}
				onblur={() => markTouched('instructions')}
				aria-invalid={shouldShow('instructions')}
				maxlength={LIMITS.instructionsMax}
				placeholder={'Preheat the oven to 180°C.\nMash the bananas in a large bowl.\nFold in the flour and bake for 45 minutes.'}
			></textarea>
			<div class="counter-row">
				<span class="hint">One step per line.</span>
				<span class="hint" class:over={draft.instructions.length > LIMITS.instructionsMax}>
					{draft.instructions.length} / {LIMITS.instructionsMax}
				</span>
			</div>
			{#if shouldShow('instructions')}
				<p class="error-text">{liveErrors.instructions}</p>
			{/if}
		</div>

		<div class="row">
			<div class="field">
				<label for="field-source">Source URL</label>
				<input
					id="field-source"
					type="url"
					bind:value={draft.source}
					onblur={() => markTouched('source')}
					aria-invalid={shouldShow('source')}
					placeholder="https://example.com/the-original-recipe"
				/>
				{#if shouldShow('source')}
					<p class="error-text">{liveErrors.source}</p>
				{/if}
			</div>

			<div class="field">
				<label for="field-youtube">Video URL</label>
				<input
					id="field-youtube"
					type="url"
					bind:value={draft.youtube}
					onblur={() => markTouched('youtube')}
					aria-invalid={shouldShow('youtube')}
					placeholder="https://www.youtube.com/watch?v=..."
				/>
				{#if shouldShow('youtube')}
					<p class="error-text">{liveErrors.youtube}</p>
				{/if}
			</div>
		</div>
	</div>

	<div class="form-actions">
		{#if submitted && !isValid}
			<p class="error-text" role="alert">Fix the highlighted fields before saving.</p>
		{/if}

		<div class="buttons">
			{#if oncancel}
				<button class="btn" type="button" onclick={oncancel}>Cancel</button>
			{/if}
			<button class="btn btn-primary" type="submit">{submitLabel}</button>
		</div>
	</div>
</form>

<style>
	.recipe-form {
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-4);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-4);
	}

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--ru-space-3);
	}

	.count {
		font-size: var(--ru-font-size-sm);
		font-variant-numeric: tabular-nums;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--ru-space-3);
	}

	.required {
		color: var(--danger);
		font-weight: 600;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field label {
		font-size: var(--ru-font-size-sm);
		font-weight: 600;
	}

	.hint {
		font-size: var(--ru-font-size-sm);
		color: var(--text-muted);
	}

	.hint.over {
		color: var(--danger);
	}

	.counter-row {
		display: flex;
		justify-content: space-between;
		gap: var(--ru-space-3);
	}

	.preview {
		margin-top: 6px;
		width: 100%;
		max-width: 260px;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		border-radius: var(--ru-radius-sm);
		border: 1px solid var(--border);
	}

	.ingredient-rows {
		display: flex;
		flex-direction: column;
		gap: var(--ru-space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.ingredient-row {
		display: grid;
		grid-template-columns: 24px minmax(0, 2fr) minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--ru-space-2);
	}

	.row-index {
		font-size: var(--ru-font-size-sm);
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.row-controls {
		display: flex;
		gap: 2px;
	}

	.icon-btn {
		width: 30px;
		height: 30px;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: var(--ru-radius-sm);
		background: var(--surface);
		color: var(--text-muted);
		font-size: 0.9rem;
		line-height: 1;
		cursor: pointer;
	}

	.icon-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.icon-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.icon-danger:hover:not(:disabled) {
		border-color: var(--danger);
		color: var(--danger);
	}

	.form-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--ru-space-3);
		position: sticky;
		bottom: 0;
		padding: var(--ru-space-3) var(--ru-space-4);
		background: color-mix(in srgb, var(--surface) 92%, transparent);
		backdrop-filter: blur(10px);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.buttons {
		display: flex;
		gap: var(--ru-space-2);
		margin-left: auto;
	}

	@media (max-width: 680px) {
		.row {
			grid-template-columns: 1fr;
		}

		.ingredient-row {
			grid-template-columns: 20px minmax(0, 1fr);
			grid-template-areas:
				'index name'
				'. measure'
				'. controls';
		}
	}
</style>
