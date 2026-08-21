import { Component, Prop, State, Event, EventEmitter, h, Host } from '@stencil/core';

export interface RatingChangeDetail {
  value: number;
}

/**
 * A star rating that works as either a read-only indicator or an input.
 *
 * When `readonly` is false the control is keyboard operable: arrow keys move
 * between values and Home/End jump to the ends, matching the ARIA slider
 * pattern that assistive technology already knows.
 */
@Component({
  tag: 'rating-stars',
  styleUrl: 'rating-stars.css',
  shadow: true,
})
export class RatingStars {
  /** Current rating. Fractional values render partially filled stars. */
  @Prop() value = 0;

  /** Number of stars to render. */
  @Prop() max = 5;

  /** When true the stars are a display-only indicator. */
  @Prop() readonly = false;

  /** Accessible label for the control. */
  @Prop() label = 'Rating';

  /** Renders the numeric value next to the stars. */
  @Prop() showValue = false;

  /** Star edge size in pixels. */
  @Prop() size = 16;

  @State() hovered = -1;

  /** Fired when an interactive rating is changed by click or keyboard. */
  @Event({ eventName: 'ratingChange' }) ratingChange: EventEmitter<RatingChangeDetail>;

  private commit(next: number) {
    const clamped = Math.min(this.max, Math.max(0, next));
    if (clamped !== this.value) {
      this.ratingChange.emit({ value: clamped });
    }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (this.readonly) return;

    const moves: Record<string, number> = {
      ArrowRight: this.value + 1,
      ArrowUp: this.value + 1,
      ArrowLeft: this.value - 1,
      ArrowDown: this.value - 1,
      Home: 0,
      End: this.max,
    };

    if (event.key in moves) {
      event.preventDefault();
      this.commit(moves[event.key]);
    }
  };

  /** Fill fraction (0-1) for the star at `index`, accounting for hover preview. */
  private fillFor(index: number): number {
    const active = this.hovered >= 0 ? this.hovered + 1 : this.value;
    return Math.min(1, Math.max(0, active - index));
  }

  render() {
    const stars = Array.from({ length: this.max }, (_, i) => i);
    const interactive = !this.readonly;

    return (
      <Host
        role={interactive ? 'slider' : 'img'}
        aria-label={this.label}
        aria-valuenow={interactive ? this.value : null}
        aria-valuemin={interactive ? 0 : null}
        aria-valuemax={interactive ? this.max : null}
        aria-valuetext={`${this.value} out of ${this.max}`}
        tabindex={interactive ? '0' : null}
        class={{ 'is-interactive': interactive }}
        onKeyDown={this.onKeyDown}
        onMouseLeave={() => (this.hovered = -1)}
      >
        <span class="stars" style={{ '--_size': `${this.size}px` }}>
          {stars.map(i => {
            const fill = this.fillFor(i);
            return (
              <span
                key={i}
                class="star"
                onMouseEnter={interactive ? () => (this.hovered = i) : undefined}
                onClick={interactive ? () => this.commit(i + 1) : undefined}
              >
                <svg viewBox="0 0 24 24" width={this.size} height={this.size} aria-hidden="true">
                  <defs>
                    <linearGradient id={`ru-star-${i}`}>
                      <stop offset={`${fill * 100}%`} stop-color="var(--_on)" />
                      <stop offset={`${fill * 100}%`} stop-color="var(--_off)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5-4.7-4.6 6.5-.9L12 2.6Z"
                    fill={`url(#ru-star-${i})`}
                    stroke="var(--_stroke)"
                    stroke-width="1.1"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            );
          })}
        </span>

        {this.showValue && <span class="value">{this.value.toFixed(1)}</span>}
      </Host>
    );
  }
}
