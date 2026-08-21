import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

export interface RecipeSelectDetail {
  recipeId: string;
  name: string;
}

export interface FavoriteToggleDetail {
  recipeId: string;
  name: string;
  /** The state the card is requesting - true means "please favorite me". */
  favorite: boolean;
}

/**
 * A presentational card summarising a single recipe.
 *
 * The component owns no state: `favorite` is controlled by the consumer, which
 * reacts to `favoriteToggle` and passes the new value back down. That keeps the
 * card usable from any framework without fighting over who owns the truth.
 *
 * @slot badge   - Content pinned to the top-left of the media area.
 * @slot         - Free-form content rendered between the meta row and the actions.
 * @slot actions - Extra controls rendered in the card footer, next to the built-in button.
 */
@Component({
  tag: 'recipe-card',
  styleUrl: 'recipe-card.css',
  shadow: true,
})
export class RecipeCard {
  /** Stable identifier passed back in every emitted event. */
  @Prop() recipeId!: string;

  /** Recipe title shown as the card heading. */
  @Prop() name!: string;

  /** Absolute or relative URL of the recipe image. */
  @Prop() image?: string;

  /** Category label, e.g. "Dessert". Rendered as the primary meta chip. */
  @Prop() category?: string;

  /** Cuisine or region label, e.g. "Italian". */
  @Prop() area?: string;

  /** Comma-separated tag list, e.g. "Pasta,Quick". Blank entries are ignored. */
  @Prop() tags?: string;

  /** Whether the recipe is currently in the user's favorites. */
  @Prop() favorite = false;

  /** Optional 0-5 rating. Omit or set to 0 to hide the stars. */
  @Prop() rating = 0;

  /** Marks the recipe as user-created, which surfaces an "Own recipe" chip. */
  @Prop() authored = false;

  /** Renders a slimmer layout for dense grids and planner columns. */
  @Prop() compact = false;

  /** Fired when the card body or its primary button is activated. */
  @Event({ eventName: 'recipeSelect' }) recipeSelect: EventEmitter<RecipeSelectDetail>;

  /** Fired when the favorite button is activated. */
  @Event({ eventName: 'favoriteToggle' }) favoriteToggle: EventEmitter<FavoriteToggleDetail>;

  private emitSelect = () => {
    this.recipeSelect.emit({ recipeId: this.recipeId, name: this.name });
  };

  private emitFavorite = (event: MouseEvent) => {
    // Stop the click from bubbling into the card's own select handler.
    event.stopPropagation();
    this.favoriteToggle.emit({
      recipeId: this.recipeId,
      name: this.name,
      favorite: !this.favorite,
    });
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.emitSelect();
    }
  };

  private get tagList(): string[] {
    return (this.tags ?? '')
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  render() {
    const tags = this.tagList;

    return (
      <Host class={{ 'is-compact': this.compact }}>
        <article
          class="card"
          role="button"
          tabindex="0"
          aria-label={`View details for ${this.name}`}
          onClick={this.emitSelect}
          onKeyDown={this.onKeyDown}
        >
          <div class="media">
            {this.image ? (
              <img src={this.image} alt={this.name} loading="lazy" decoding="async" />
            ) : (
              <div class="media-fallback" aria-hidden="true">
                <span>{this.name?.charAt(0) ?? '?'}</span>
              </div>
            )}

            <div class="badge-slot">
              <slot name="badge" />
              {this.authored && <span class="chip chip-authored">Own recipe</span>}
            </div>

            <button
              class={{ fav: true, 'fav-on': this.favorite }}
              type="button"
              aria-pressed={String(this.favorite)}
              aria-label={this.favorite ? `Remove ${this.name} from favorites` : `Add ${this.name} to favorites`}
              title={this.favorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={this.emitFavorite}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M12 21s-7.5-4.7-9.6-9A5.4 5.4 0 0 1 12 6.2 5.4 5.4 0 0 1 21.6 12c-2.1 4.3-9.6 9-9.6 9Z"
                  fill={this.favorite ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <div class="body">
            <h3 class="title" title={this.name}>
              {this.name}
            </h3>

            <div class="meta">
              {this.category && <span class="chip">{this.category}</span>}
              {this.area && <span class="chip chip-muted">{this.area}</span>}
            </div>

            {this.rating > 0 && (
              <rating-stars value={this.rating} readonly label={`Rated ${this.rating} out of 5`} />
            )}

            {tags.length > 0 && (
              <ul class="tags">
                {tags.slice(0, 3).map(tag => (
                  <li key={tag}>#{tag}</li>
                ))}
              </ul>
            )}

            <div class="extra">
              <slot />
            </div>
          </div>

          <footer class="actions">
            <button class="primary" type="button" onClick={this.emitSelect}>
              View recipe
            </button>
            <slot name="actions" />
          </footer>
        </article>
      </Host>
    );
  }
}
