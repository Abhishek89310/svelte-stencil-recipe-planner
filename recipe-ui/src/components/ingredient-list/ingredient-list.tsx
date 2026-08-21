import { Component, Prop, State, Event, EventEmitter, h, Host } from '@stencil/core';

export interface Ingredient {
  name: string;
  measure?: string;
}

export interface IngredientCheckDetail {
  index: number;
  name: string;
  checked: boolean;
}

/**
 * Renders an ingredient checklist.
 *
 * `items` accepts either a real array (set as a DOM property, which is how
 * SvelteKit binds it) or a JSON string (useful from plain HTML). Parsing both
 * shapes keeps the component honest in either environment.
 *
 * @slot header - Replaces the default heading row.
 * @slot        - Rendered under the list, e.g. a "add all to shopping list" button.
 */
@Component({
  tag: 'ingredient-list',
  styleUrl: 'ingredient-list.css',
  shadow: true,
})
export class IngredientList {
  /** Ingredients as an array of `{ name, measure }`, or a JSON string of the same. */
  @Prop() items: Ingredient[] | string = [];

  /** Heading text shown above the list. */
  @Prop() heading = 'Ingredients';

  /** When true each row gets a checkbox and emits `ingredientCheck`. */
  @Prop() checkable = false;

  /** Renders the list in two columns on wide viewports. */
  @Prop() columns = false;

  @State() checked: Record<number, boolean> = {};

  /** Fired when a checkable row is toggled. */
  @Event({ eventName: 'ingredientCheck' }) ingredientCheck: EventEmitter<IngredientCheckDetail>;

  private get parsed(): Ingredient[] {
    const raw = this.items;
    if (Array.isArray(raw)) return raw;
    if (typeof raw !== 'string' || raw.trim() === '') return [];
    try {
      const value = JSON.parse(raw);
      return Array.isArray(value) ? value : [];
    } catch {
      // A malformed attribute should degrade to an empty list, not a crash.
      return [];
    }
  }

  private toggle(index: number, name: string) {
    const next = !this.checked[index];
    this.checked = { ...this.checked, [index]: next };
    this.ingredientCheck.emit({ index, name, checked: next });
  }

  render() {
    const items = this.parsed;
    const doneCount = Object.values(this.checked).filter(Boolean).length;

    return (
      <Host>
        <div class="head">
          <slot name="header">
            <h4 class="heading">{this.heading}</h4>
            <span class="count">
              {this.checkable && items.length > 0
                ? `${doneCount} / ${items.length}`
                : `${items.length} item${items.length === 1 ? '' : 's'}`}
            </span>
          </slot>
        </div>

        {items.length === 0 ? (
          <p class="empty">No ingredients listed.</p>
        ) : (
          <ul class={{ list: true, 'is-columns': this.columns }}>
            {items.map((item, index) => {
              const isChecked = !!this.checked[index];
              const row = [
                <span class="name">{item.name}</span>,
                item.measure ? <span class="measure">{item.measure}</span> : null,
              ];

              return (
                <li key={`${item.name}-${index}`} class={{ row: true, 'is-checked': isChecked }}>
                  {this.checkable ? (
                    <label class="check">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => this.toggle(index, item.name)}
                      />
                      <span class="box" aria-hidden="true" />
                      {row}
                    </label>
                  ) : (
                    <div class="check is-static">
                      <span class="bullet" aria-hidden="true" />
                      {row}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div class="footer">
          <slot />
        </div>
      </Host>
    );
  }
}
