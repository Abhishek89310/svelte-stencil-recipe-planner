import { newSpecPage } from '@stencil/core/testing';
import { RatingStars } from './rating-stars';

describe('rating-stars', () => {
  const render = (html: string) => newSpecPage({ components: [RatingStars], html });

  it('renders `max` stars', async () => {
    const page = await render('<rating-stars value="3" max="7"></rating-stars>');
    expect(page.root.shadowRoot.querySelectorAll('.star').length).toBe(7);
  });

  it('is a non-focusable image when read-only', async () => {
    const page = await render('<rating-stars value="4" readonly="true"></rating-stars>');
    expect(page.root.getAttribute('role')).toBe('img');
    expect(page.root.getAttribute('tabindex')).toBeNull();
  });

  it('exposes the ARIA slider pattern when interactive', async () => {
    const page = await render('<rating-stars value="2"></rating-stars>');
    expect(page.root.getAttribute('role')).toBe('slider');
    expect(page.root.getAttribute('aria-valuenow')).toBe('2');
    expect(page.root.getAttribute('tabindex')).toBe('0');
  });

  it('emits the clicked star index plus one', async () => {
    const page = await render('<rating-stars value="1"></rating-stars>');
    const spy = jest.fn();
    page.root.addEventListener('ratingChange', spy);

    (page.root.shadowRoot.querySelectorAll('.star')[3] as HTMLElement).click();
    await page.waitForChanges();

    expect(spy.mock.calls[0][0].detail).toEqual({ value: 4 });
  });

  it('does not emit when the value is unchanged', async () => {
    const page = await render('<rating-stars value="3"></rating-stars>');
    const spy = jest.fn();
    page.root.addEventListener('ratingChange', spy);

    (page.root.shadowRoot.querySelectorAll('.star')[2] as HTMLElement).click();
    await page.waitForChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it('ignores clicks entirely when read-only', async () => {
    const page = await render('<rating-stars value="1" readonly="true"></rating-stars>');
    const spy = jest.fn();
    page.root.addEventListener('ratingChange', spy);

    (page.root.shadowRoot.querySelectorAll('.star')[4] as HTMLElement).click();
    await page.waitForChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it('clamps keyboard navigation to the 0..max range', async () => {
    const page = await render('<rating-stars value="5" max="5"></rating-stars>');
    const spy = jest.fn();
    page.root.addEventListener('ratingChange', spy);

    // Already at the maximum, so ArrowRight has nowhere to go.
    page.root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await page.waitForChanges();
    expect(spy).not.toHaveBeenCalled();

    page.root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    await page.waitForChanges();
    expect(spy.mock.calls[0][0].detail).toEqual({ value: 0 });
  });
});
