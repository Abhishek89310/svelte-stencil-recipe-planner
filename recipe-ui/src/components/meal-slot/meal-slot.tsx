import { Component, Prop, State, Event, EventEmitter, h, Host } from '@stencil/core';

export interface MealSlotDetail {
  day: string;
  meal: string;
  recipeId?: string;
}

export interface MealDropDetail extends MealSlotDetail {
  /** The recipe id read from the drag payload. */
  droppedRecipeId: string;
}

/**
 * One cell of the weekly meal planner grid.
 *
 * The slot is both a drop target (for drag-and-drop planning) and a plain
 * button (for click-to-assign), so the planner stays usable with a keyboard
 * and on touch devices where dragging is awkward.
 *
 * @slot empty - Replaces the default empty-state content.
 * @slot       - Extra content rendered under a filled slot.
 */
@Component({
  tag: 'meal-slot',
  styleUrl: 'meal-slot.css',
  shadow: true,
})
export class MealSlot {
  /** Day key, e.g. "Monday". Echoed back in every event. */
  @Prop() day!: string;

  /** Meal key, e.g. "Breakfast". Echoed back in every event. */
  @Prop() meal!: string;

  /** Id of the assigned recipe. Leave unset to render the empty state. */
  @Prop() recipeId?: string;

  /** Title of the assigned recipe. */
  @Prop() recipeName?: string;

  /** Thumbnail of the assigned recipe. */
  @Prop() recipeImage?: string;

  /** Secondary line under the title, e.g. the category. */
  @Prop() recipeMeta?: string;

  /** Highlights the slot, e.g. for the current day. */
  @Prop() highlighted = false;

  /** MIME type read from the drag payload. Must match what the drag source sets. */
  @Prop() dropMimeType = 'text/recipe-id';

  @State() dragOver = false;

  /** Fired when an empty slot is activated, asking the host to open a picker. */
  @Event({ eventName: 'mealAssign' }) mealAssign: EventEmitter<MealSlotDetail>;

  /** Fired when the remove button on a filled slot is activated. */
  @Event({ eventName: 'mealRemove' }) mealRemove: EventEmitter<MealSlotDetail>;

  /** Fired when a filled slot's body is activated, to open the recipe. */
  @Event({ eventName: 'mealOpen' }) mealOpen: EventEmitter<MealSlotDetail>;

  /** Fired when a recipe is dropped onto the slot. */
  @Event({ eventName: 'mealDrop' }) mealDrop: EventEmitter<MealDropDetail>;

  private get base(): MealSlotDetail {
    return { day: this.day, meal: this.meal, recipeId: this.recipeId };
  }

  private onActivate = () => {
    if (this.recipeId) {
      this.mealOpen.emit(this.base);
    } else {
      this.mealAssign.emit(this.base);
    }
  };

  private onRemove = (event: MouseEvent) => {
    event.stopPropagation();
    this.mealRemove.emit(this.base);
  };

  private onDragOver = (event: DragEvent) => {
    // Calling preventDefault is what marks this element as a valid drop target.
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    this.dragOver = true;
  };

  private onDragLeave = () => {
    this.dragOver = false;
  };

  private onDrop = (event: DragEvent) => {
    event.preventDefault();
    this.dragOver = false;
    const droppedRecipeId =
      event.dataTransfer?.getData(this.dropMimeType) || event.dataTransfer?.getData('text/plain');
    if (droppedRecipeId) {
      this.mealDrop.emit({ ...this.base, droppedRecipeId });
    }
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onActivate();
    }
  };

  render() {
    const filled = !!this.recipeId;

    return (
      <Host
        class={{ 'is-filled': filled, 'is-over': this.dragOver, 'is-highlighted': this.highlighted }}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        onDrop={this.onDrop}
      >
        <div
          class="slot"
          role="button"
          tabindex="0"
          aria-label={
            filled
              ? `${this.meal} on ${this.day}: ${this.recipeName}. Activate to open.`
              : `Add a recipe for ${this.meal} on ${this.day}`
          }
          onClick={this.onActivate}
          onKeyDown={this.onKeyDown}
        >
          {filled ? (
            <div class="filled">
              {this.recipeImage ? (
                <img class="thumb" src={this.recipeImage} alt="" loading="lazy" decoding="async" />
              ) : (
                <span class="thumb thumb-fallback" aria-hidden="true">
                  {this.recipeName?.charAt(0) ?? '?'}
                </span>
              )}

              <span class="text">
                <span class="name">{this.recipeName}</span>
                {this.recipeMeta && <span class="meta">{this.recipeMeta}</span>}
              </span>

              <button
                class="remove"
                type="button"
                aria-label={`Remove ${this.recipeName} from ${this.meal} on ${this.day}`}
                title="Remove from plan"
                onClick={this.onRemove}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          ) : (
            <div class="empty">
              <slot name="empty">
                <span class="plus" aria-hidden="true">
                  +
                </span>
                <span class="hint">Add {this.meal.toLowerCase()}</span>
              </slot>
            </div>
          )}
        </div>

        <div class="extra">
          <slot />
        </div>
      </Host>
    );
  }
}
