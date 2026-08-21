import { newSpecPage } from '@stencil/core/testing';
import { RecipeCard } from './recipe-card';

describe('recipe-card', () => {
  const render = (html: string) => newSpecPage({ components: [RecipeCard], html });

  it('renders the recipe title', async () => {
    const page = await render('<recipe-card recipe-id="1" name="Tiramisu"></recipe-card>');
    expect(page.root.shadowRoot.querySelector('.title').textContent).toBe('Tiramisu');
  });

  it('falls back to an initial when no image is given', async () => {
    const page = await render('<recipe-card recipe-id="1" name="Tiramisu"></recipe-card>');
    expect(page.root.shadowRoot.querySelector('img')).toBeNull();
    expect(page.root.shadowRoot.querySelector('.media-fallback span').textContent).toBe('T');
  });

  it('splits the tags prop and ignores blank entries', async () => {
    const page = await render('<recipe-card recipe-id="1" name="X" tags="Pasta, ,Quick"></recipe-card>');
    const tags = Array.from(page.root.shadowRoot.querySelectorAll('.tags li')).map(li => li.textContent);
    expect(tags).toEqual(['#Pasta', '#Quick']);
  });

  it('caps the rendered tags at three', async () => {
    const page = await render('<recipe-card recipe-id="1" name="X" tags="a,b,c,d,e"></recipe-card>');
    expect(page.root.shadowRoot.querySelectorAll('.tags li').length).toBe(3);
  });

  it('emits recipeSelect when the card is clicked', async () => {
    const page = await render('<recipe-card recipe-id="52771" name="Penne"></recipe-card>');
    const spy = jest.fn();
    page.root.addEventListener('recipeSelect', spy);

    (page.root.shadowRoot.querySelector('.card') as HTMLElement).click();
    await page.waitForChanges();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].detail).toEqual({ recipeId: '52771', name: 'Penne' });
  });

  it('requests the opposite favorite state and does not select the card', async () => {
    const page = await render('<recipe-card recipe-id="9" name="Soup" favorite="true"></recipe-card>');
    const favSpy = jest.fn();
    const selectSpy = jest.fn();
    page.root.addEventListener('favoriteToggle', favSpy);
    page.root.addEventListener('recipeSelect', selectSpy);

    (page.root.shadowRoot.querySelector('.fav') as HTMLElement).click();
    await page.waitForChanges();

    expect(favSpy.mock.calls[0][0].detail).toEqual({ recipeId: '9', name: 'Soup', favorite: false });
    // The favorite button stops propagation, so the card must not also fire select.
    expect(selectSpy).not.toHaveBeenCalled();
  });

  it('hides the rating when it is zero', async () => {
    const page = await render('<recipe-card recipe-id="1" name="X"></recipe-card>');
    expect(page.root.shadowRoot.querySelector('rating-stars')).toBeNull();
  });

  it('marks user-created recipes with a chip', async () => {
    const page = await render('<recipe-card recipe-id="1" name="X" authored="true"></recipe-card>');
    expect(page.root.shadowRoot.querySelector('.chip-authored').textContent).toBe('Own recipe');
  });
});
