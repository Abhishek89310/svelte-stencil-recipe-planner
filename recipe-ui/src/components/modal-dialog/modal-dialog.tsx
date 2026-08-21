import { Component, Prop, Element, Event, EventEmitter, Watch, Method, h, Host } from '@stencil/core';

/**
 * An accessible modal built on the native `<dialog>` element.
 *
 * Delegating to `<dialog>` buys focus trapping, the top layer, inert background
 * content and Escape handling from the platform rather than re-implementing
 * them. `open` stays the source of truth: closing always routes through
 * `dialogClose` so the consumer's state and the DOM cannot drift apart.
 *
 * @slot header - Replaces the default heading.
 * @slot        - Dialog body content.
 * @slot footer - Action row pinned to the bottom of the dialog.
 */
@Component({
  tag: 'modal-dialog',
  styleUrl: 'modal-dialog.css',
  shadow: true,
})
export class ModalDialog {
  @Element() host!: HTMLElement;

  /** Controls visibility. The component never flips this itself. */
  @Prop() open = false;

  /** Text of the default heading. */
  @Prop() heading = '';

  /** Supporting line under the heading. */
  @Prop() subheading = '';

  /** Hides the built-in close button, e.g. for a forced choice. */
  @Prop() hideClose = false;

  /** When true, clicking the backdrop does not request a close. */
  @Prop() persistent = false;

  /** Max width of the dialog panel, as any CSS length. */
  @Prop() width = '560px';

  /** Fired whenever a close is requested: button, Escape, or backdrop click. */
  @Event({ eventName: 'dialogClose' }) dialogClose: EventEmitter<void>;

  /** Fired once the dialog has finished opening. */
  @Event({ eventName: 'dialogOpen' }) dialogOpen: EventEmitter<void>;

  private dialogEl?: HTMLDialogElement;

  componentDidLoad() {
    if (this.open) this.sync(true);
  }

  disconnectedCallback() {
    // Leaving a modal open in the top layer would block the rest of the page.
    if (this.dialogEl?.open) this.dialogEl.close();
  }

  @Watch('open')
  onOpenChange(next: boolean) {
    this.sync(next);
  }

  /** Imperatively request a close, emitting `dialogClose`. */
  @Method()
  async requestClose() {
    this.dialogClose.emit();
  }

  private sync(shouldOpen: boolean) {
    const el = this.dialogEl;
    if (!el) return;

    if (shouldOpen && !el.open) {
      el.showModal();
      this.dialogOpen.emit();
    } else if (!shouldOpen && el.open) {
      el.close();
    }
  }

  /** Escape and the form-method=dialog close both surface as `cancel`/`close`. */
  private onCancel = (event: Event) => {
    // Keep the DOM closed only if the consumer agrees, so `open` stays authoritative.
    event.preventDefault();
    this.dialogClose.emit();
  };

  private onBackdropClick = (event: MouseEvent) => {
    if (this.persistent) return;
    // With showModal(), a click on the backdrop reports the <dialog> element
    // itself as the target, while a click anywhere inside reports the panel or
    // one of its descendants. Comparing targets is therefore enough to tell the
    // two apart - and crucially it leaves the event free to keep bubbling, so
    // handlers the consumer attached to slotted buttons still run.
    if (event.target === this.dialogEl) {
      this.dialogClose.emit();
    }
  };

  render() {
    return (
      <Host>
        <dialog
          ref={el => (this.dialogEl = el as HTMLDialogElement)}
          class="dialog"
          style={{ '--_width': this.width }}
          aria-label={this.heading || undefined}
          onCancel={this.onCancel}
          onClick={this.onBackdropClick}
        >
          <div class="panel">
            <header class="head">
              <div class="titles">
                <slot name="header">
                  {this.heading && <h2 class="heading">{this.heading}</h2>}
                  {this.subheading && <p class="subheading">{this.subheading}</p>}
                </slot>
              </div>

              {!this.hideClose && (
                <button
                  class="close"
                  type="button"
                  aria-label="Close dialog"
                  onClick={() => this.dialogClose.emit()}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </button>
              )}
            </header>

            <div class="body">
              <slot />
            </div>

            <footer class="foot">
              <slot name="footer" />
            </footer>
          </div>
        </dialog>
      </Host>
    );
  }
}
