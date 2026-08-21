import { newSpecPage } from '@stencil/core/testing';
import { ModalDialog } from './modal-dialog';

describe('modal-dialog', () => {
  const render = (html: string) => newSpecPage({ components: [ModalDialog], html });

  it('renders the heading and subheading', async () => {
    const page = await render(
      '<modal-dialog heading="Delete?" subheading="Cannot be undone"></modal-dialog>'
    );
    expect(page.root.shadowRoot.querySelector('.heading').textContent).toBe('Delete?');
    expect(page.root.shadowRoot.querySelector('.subheading').textContent).toBe('Cannot be undone');
  });

  it('renders the close button by default and hides it on request', async () => {
    const shown = await render('<modal-dialog heading="X"></modal-dialog>');
    expect(shown.root.shadowRoot.querySelector('.close')).not.toBeNull();

    const hidden = await render('<modal-dialog heading="X" hide-close="true"></modal-dialog>');
    expect(hidden.root.shadowRoot.querySelector('.close')).toBeNull();
  });

  it('emits dialogClose from the close button instead of closing itself', async () => {
    const page = await render('<modal-dialog heading="X"></modal-dialog>');
    const spy = jest.fn();
    page.root.addEventListener('dialogClose', spy);

    (page.root.shadowRoot.querySelector('.close') as HTMLElement).click();
    await page.waitForChanges();

    expect(spy).toHaveBeenCalledTimes(1);
    // `open` is the consumer's to change; the component must not flip it.
    expect(page.root.open).toBe(false);
  });

  it('requests a close when the backdrop is clicked', async () => {
    const page = await render('<modal-dialog heading="X"></modal-dialog>');
    const spy = jest.fn();
    page.root.addEventListener('dialogClose', spy);

    const dialog = page.root.shadowRoot.querySelector('dialog');
    dialog.dispatchEvent(Object.assign(new Event('click', { bubbles: true }), { target: dialog }));
    await page.waitForChanges();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('ignores backdrop clicks when persistent', async () => {
    const page = await render('<modal-dialog heading="X" persistent="true"></modal-dialog>');
    const spy = jest.fn();
    page.root.addEventListener('dialogClose', spy);

    const dialog = page.root.shadowRoot.querySelector('dialog');
    dialog.dispatchEvent(Object.assign(new Event('click', { bubbles: true }), { target: dialog }));
    await page.waitForChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it('lets clicks from slotted content keep bubbling', async () => {
    // Regression guard: the panel must not call stopPropagation, or a consumer's
    // handler on a slotted footer button never runs.
    const page = await render(
      '<modal-dialog heading="X"><button slot="footer" id="save">Save</button></modal-dialog>'
    );

    const reachedTop = jest.fn();
    page.doc.addEventListener('click', reachedTop);

    const closeSpy = jest.fn();
    page.root.addEventListener('dialogClose', closeSpy);

    const panel = page.root.shadowRoot.querySelector('.panel');
    panel.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
    await page.waitForChanges();

    expect(reachedTop).toHaveBeenCalled();
    // A click inside the panel is not a backdrop click.
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('exposes requestClose for imperative use', async () => {
    const page = await render('<modal-dialog heading="X"></modal-dialog>');
    const spy = jest.fn();
    page.root.addEventListener('dialogClose', spy);

    await page.root.requestClose();
    await page.waitForChanges();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
