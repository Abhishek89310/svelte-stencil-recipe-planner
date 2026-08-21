import { newSpecPage } from '@stencil/core/testing';
import { IngredientList } from './ingredient-list';

describe('ingredient-list', () => {
  const items = [
    { name: 'Penne', measure: '1 pound' },
    { name: 'Garlic', measure: '3 cloves' },
  ];

  const renderWith = async (props: Record<string, unknown>) => {
    const page = await newSpecPage({
      components: [IngredientList],
      html: '<ingredient-list></ingredient-list>',
    });
    Object.assign(page.root, props);
    await page.waitForChanges();
    return page;
  };

  it('renders items passed as an array property', async () => {
    const page = await renderWith({ items });
    const names = Array.from(page.root.shadowRoot.querySelectorAll('.name')).map(el => el.textContent);
    expect(names).toEqual(['Penne', 'Garlic']);
  });

  it('parses items passed as a JSON string attribute', async () => {
    const page = await renderWith({ items: JSON.stringify(items) });
    expect(page.root.shadowRoot.querySelectorAll('.row').length).toBe(2);
  });

  it('degrades to an empty list when the JSON is malformed', async () => {
    const page = await renderWith({ items: '{not json' });
    expect(page.root.shadowRoot.querySelector('.empty').textContent).toBe('No ingredients listed.');
  });

  it('shows a bullet instead of a checkbox when not checkable', async () => {
    const page = await renderWith({ items });
    expect(page.root.shadowRoot.querySelector('input[type="checkbox"]')).toBeNull();
    expect(page.root.shadowRoot.querySelectorAll('.bullet').length).toBe(2);
  });

  it('emits ingredientCheck and tracks progress in the header', async () => {
    const page = await renderWith({ items, checkable: true });
    const spy = jest.fn();
    page.root.addEventListener('ingredientCheck', spy);

    // The mock DOM does not derive `change` from a click, so dispatch it directly.
    const box = page.root.shadowRoot.querySelectorAll('input[type="checkbox"]')[1];
    box.dispatchEvent(new Event('change'));
    await page.waitForChanges();

    expect(spy.mock.calls[0][0].detail).toEqual({ index: 1, name: 'Garlic', checked: true });
    expect(page.root.shadowRoot.querySelector('.count').textContent).toBe('1 / 2');
  });

  it('counts items when it is not checkable', async () => {
    const page = await renderWith({ items });
    expect(page.root.shadowRoot.querySelector('.count').textContent).toBe('2 items');
  });
});
