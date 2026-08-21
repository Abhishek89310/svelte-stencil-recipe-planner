import { Component, Prop, State, Event, EventEmitter, Watch, h, Host } from '@stencil/core';

export interface SearchDetail {
  /** The trimmed query string. */
  query: string;
}

/**
 * A debounced search field with an optional filter tray.
 *
 * Two events are emitted deliberately: `searchInput` fires on every debounced
 * keystroke so a consumer can drive live results, while `searchSubmit` fires
 * only on Enter or the button. Consumers pick whichever suits their API budget.
 *
 * @slot filters - Rendered under the input, intended for select/chip filters.
 * @slot         - Rendered after the filter tray, e.g. a result count line.
 */
@Component({
  tag: 'recipe-search-bar',
  styleUrl: 'recipe-search-bar.css',
  shadow: true,
})
export class RecipeSearchBar {
  /** Placeholder text for the input. */
  @Prop() placeholder = 'Search recipes...';

  /** Controlled value. Updating it from the consumer resets the internal draft. */
  @Prop() value = '';

  /** Milliseconds to wait after the last keystroke before emitting `searchInput`. */
  @Prop() debounce = 350;

  /** Text of the submit button. Set to an empty string to hide the button. */
  @Prop() submitLabel = 'Search';

  /** Shows a spinner in place of the search icon. */
  @Prop() loading = false;

  /** Disables the whole control. */
  @Prop() disabled = false;

  @State() draft = '';

  private timer: ReturnType<typeof setTimeout>;
  private inputEl?: HTMLInputElement;

  /** Fired after the debounce window closes on each edit. */
  @Event({ eventName: 'searchInput' }) searchInput: EventEmitter<SearchDetail>;

  /** Fired when the user presses Enter or activates the submit button. */
  @Event({ eventName: 'searchSubmit' }) searchSubmit: EventEmitter<SearchDetail>;

  /** Fired when the clear button empties the field. */
  @Event({ eventName: 'searchClear' }) searchClear: EventEmitter<void>;

  componentWillLoad() {
    this.draft = this.value ?? '';
  }

  @Watch('value')
  onValueChange(next: string) {
    this.draft = next ?? '';
  }

  disconnectedCallback() {
    clearTimeout(this.timer);
  }

  private onInput = (event: Event) => {
    this.draft = (event.target as HTMLInputElement).value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.searchInput.emit({ query: this.draft.trim() });
    }, this.debounce);
  };

  private onSubmit = (event?: Event) => {
    event?.preventDefault();
    // A submit supersedes any pending debounced input event.
    clearTimeout(this.timer);
    this.searchSubmit.emit({ query: this.draft.trim() });
  };

  private onClear = () => {
    clearTimeout(this.timer);
    this.draft = '';
    this.searchClear.emit();
    this.searchInput.emit({ query: '' });
    this.inputEl?.focus();
  };

  render() {
    return (
      <Host>
        <form class="wrap" role="search" onSubmit={this.onSubmit}>
          <div class={{ field: true, 'is-disabled': this.disabled }}>
            <span class="icon" aria-hidden="true">
              {this.loading ? (
                <span class="spinner" />
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
                  <path d="m20 20-3.6-3.6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              )}
            </span>

            <input
              ref={el => (this.inputEl = el)}
              type="search"
              class="input"
              part="input"
              value={this.draft}
              placeholder={this.placeholder}
              disabled={this.disabled}
              aria-label={this.placeholder}
              autocomplete="off"
              onInput={this.onInput}
            />

            {this.draft.length > 0 && (
              <button class="clear" type="button" aria-label="Clear search" onClick={this.onClear}>
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </button>
            )}

            {this.submitLabel !== '' && (
              <button class="submit" type="submit" disabled={this.disabled}>
                {this.submitLabel}
              </button>
            )}
          </div>

          <div class="filters">
            <slot name="filters" />
          </div>

          <div class="footer">
            <slot />
          </div>
        </form>
      </Host>
    );
  }
}
