import { newSpecPage } from '@stencil/core/testing';
import { MealSlot } from './meal-slot';

describe('meal-slot', () => {
  const render = (html: string) => newSpecPage({ components: [MealSlot], html });

  const filled =
    '<meal-slot day="Monday" meal="Lunch" recipe-id="52771" recipe-name="Penne"></meal-slot>';
  const empty = '<meal-slot day="Monday" meal="Lunch"></meal-slot>';

  it('renders the empty state hint when no recipe is assigned', async () => {
    const page = await render(empty);
    expect(page.root.shadowRoot.querySelector('.hint').textContent).toBe('Add lunch');
  });

  it('emits mealAssign when an empty slot is activated', async () => {
    const page = await render(empty);
    const spy = jest.fn();
    page.root.addEventListener('mealAssign', spy);

    (page.root.shadowRoot.querySelector('.slot') as HTMLElement).click();
    await page.waitForChanges();

    expect(spy.mock.calls[0][0].detail).toEqual({ day: 'Monday', meal: 'Lunch', recipeId: undefined });
  });

  it('emits mealOpen instead of mealAssign when it is filled', async () => {
    const page = await render(filled);
    const openSpy = jest.fn();
    const assignSpy = jest.fn();
    page.root.addEventListener('mealOpen', openSpy);
    page.root.addEventListener('mealAssign', assignSpy);

    (page.root.shadowRoot.querySelector('.slot') as HTMLElement).click();
    await page.waitForChanges();

    expect(openSpy.mock.calls[0][0].detail.recipeId).toBe('52771');
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('emits mealRemove without also opening the recipe', async () => {
    const page = await render(filled);
    const removeSpy = jest.fn();
    const openSpy = jest.fn();
    page.root.addEventListener('mealRemove', removeSpy);
    page.root.addEventListener('mealOpen', openSpy);

    (page.root.shadowRoot.querySelector('.remove') as HTMLElement).click();
    await page.waitForChanges();

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('emits mealDrop with the dragged recipe id', async () => {
    const page = await render(empty);
    const spy = jest.fn();
    page.root.addEventListener('mealDrop', spy);

    const event: any = new Event('drop', { bubbles: true });
    event.dataTransfer = { getData: (type: string) => (type === 'text/recipe-id' ? '52771' : '') };
    page.root.dispatchEvent(event);
    await page.waitForChanges();

    expect(spy.mock.calls[0][0].detail.droppedRecipeId).toBe('52771');
  });

  it('ignores a drop that carries no recipe id', async () => {
    const page = await render(empty);
    const spy = jest.fn();
    page.root.addEventListener('mealDrop', spy);

    const event: any = new Event('drop', { bubbles: true });
    event.dataTransfer = { getData: () => '' };
    page.root.dispatchEvent(event);
    await page.waitForChanges();

    expect(spy).not.toHaveBeenCalled();
  });
});
