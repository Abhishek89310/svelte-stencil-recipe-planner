# @abhishek/recipe-ui

A framework-agnostic web component library for recipe discovery and meal planning
interfaces, built with [StencilJS](https://stenciljs.com/).

The components compile to standard Custom Elements, so they run unchanged in
SvelteKit, React, Angular, Vue, or a plain HTML page. This package is the
component layer consumed by the Recipe Finder & Meal Planner SvelteKit
application that lives alongside it in this repository.

---

## Installation

```bash
npm install @abhishek/recipe-ui
```

## Usage

### Registering the components

Call the loader once, on the client, before the elements are used. In SvelteKit
that means inside `onMount` (or any browser-only module), because custom element
registration needs a real DOM:

```js
import { defineCustomElements } from '@abhishek/recipe-ui/loader';
import '@abhishek/recipe-ui/dist/recipe-ui/recipe-ui.css'; // design tokens

defineCustomElements();
```

The stylesheet is optional. It only defines the `--ru-*` design tokens; every
component ships fallback values, so it renders correctly without it.

### Rendering a component

```html
<recipe-card
  recipe-id="52771"
  name="Spicy Arrabiata Penne"
  image="https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg"
  category="Vegetarian"
  area="Italian"
  rating="4.5"
>
  <span slot="badge">30 min</span>
  <button slot="actions">Add to plan</button>
</recipe-card>
```

```js
document.querySelector('recipe-card').addEventListener('favoriteToggle', (event) => {
  console.log(event.detail); // { recipeId, name, favorite }
});
```

### Attributes vs. properties

Primitive props (string, number, boolean) can be set as kebab-case HTML
attributes. Object and array props — such as `ingredient-list`'s `items` — must
be set as a DOM **property**, since attributes can only carry strings:

```js
listEl.items = [{ name: 'Garlic', measure: '3 cloves' }];
```

As a convenience for template-only environments, `items` also accepts a JSON
string, so `items='[{"name":"Garlic"}]'` works as an attribute too.

---

## Components

| Tag | Purpose |
| --- | --- |
| `<recipe-card>` | Recipe summary card with favorite toggle, meta chips and action slots |
| `<recipe-search-bar>` | Debounced search field with a slot for filter controls |
| `<rating-stars>` | Star rating, read-only indicator or keyboard-operable input |
| `<ingredient-list>` | Ingredient checklist with optional checkboxes and two-column layout |
| `<meal-slot>` | One cell of a weekly planner; click-to-assign and drop target |
| `<modal-dialog>` | Accessible modal built on the native `<dialog>` element |

Per-component API tables — every prop, event, slot and CSS custom property — are
generated from the source at build time and live in each component folder, e.g.
[`src/components/recipe-card/readme.md`](src/components/recipe-card/readme.md).
A machine-readable version is written to [`docs/components.json`](docs/components.json).

### Events

All events are `CustomEvent`s that bubble and compose, so they can be handled on
any ancestor element.

| Event | Emitted by | `detail` |
| --- | --- | --- |
| `recipeSelect` | `recipe-card` | `{ recipeId, name }` |
| `favoriteToggle` | `recipe-card` | `{ recipeId, name, favorite }` |
| `searchInput` | `recipe-search-bar` | `{ query }` (debounced) |
| `searchSubmit` | `recipe-search-bar` | `{ query }` |
| `searchClear` | `recipe-search-bar` | — |
| `ratingChange` | `rating-stars` | `{ value }` |
| `ingredientCheck` | `ingredient-list` | `{ index, name, checked }` |
| `mealAssign` | `meal-slot` | `{ day, meal, recipeId }` |
| `mealRemove` | `meal-slot` | `{ day, meal, recipeId }` |
| `mealOpen` | `meal-slot` | `{ day, meal, recipeId }` |
| `mealDrop` | `meal-slot` | `{ day, meal, recipeId, droppedRecipeId }` |
| `dialogClose` | `modal-dialog` | — |
| `dialogOpen` | `modal-dialog` | — |

TypeScript payload types are exported from the package root:

```ts
import type { FavoriteToggleDetail, MealDropDetail } from '@abhishek/recipe-ui';
```

---

## Theming

Every visual value resolves from a `--ru-*` custom property with a built-in
fallback. Override any of them on `:root` or on a container to restyle the whole
library:

```css
:root {
  --ru-color-accent: #0f766e;
  --ru-radius-md: 4px;
  --ru-font-family: 'Inter', system-ui, sans-serif;
}
```

The full token list is in [`src/global/theme.css`](src/global/theme.css). The
default palette also ships a `prefers-color-scheme: dark` variant.

Because the components use Shadow DOM, page-level CSS cannot reach inside them —
that encapsulation is the point. Tokens (and the exposed `part` attributes) are
the supported styling surface.

---

## Development

```bash
npm install
npm start          # dev server with the component gallery at src/index.html
npm run build      # production build + regenerated docs
npm test           # unit tests
```

`npm start` serves an interactive gallery of every component. It logs each
emitted event to the browser console, which is the quickest way to check an
event payload while developing.

---

## Publishing

The version follows [semantic versioning](https://semver.org/): patch for fixes,
minor for new components or props, major for a breaking prop/event change.

```bash
npm login
npm version patch      # or minor / major
npm publish            # prepublishOnly runs the build first
```

`prepublishOnly` rebuilds the package, so a stale `dist/` can never be
published. Only `dist/`, `loader/`, `README.md` and `LICENSE` are included in the
tarball — verify with `npm pack --dry-run`.

---

## Browser support

Modern evergreen browsers. The library targets ES2022 and relies on native
Custom Elements, Shadow DOM and `<dialog>`; no polyfills or ES5 build are
shipped.

## License

MIT — see [LICENSE](LICENSE).
