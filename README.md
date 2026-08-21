# Recipe Finder & Meal Planner

A recipe discovery and weekly meal planning application, built with **SvelteKit
(Svelte 5)** and a **StencilJS web component library** published to npm and
consumed as a dependency.

The repository holds two independent projects:

```
.
├── recipe-ui/     StencilJS component library  →  published to npm
└── recipe-app/    SvelteKit application        →  installs and uses that package
```

---

## Table of contents

- [What it does](#what-it-does)
- [Quick start](#quick-start)
- [Running the development servers](#running-the-development-servers)
- [Project structure](#project-structure)
- [The component library](#the-component-library)
- [SvelteKit ↔ Stencil integration](#sveltekit--stencil-integration)
- [Publishing to npm](#publishing-to-npm)
- [Building for production](#building-for-production)
- [Deployment](#deployment)
- [Testing and quality checks](#testing-and-quality-checks)
- [Assumptions](#assumptions)
- [Known limitations](#known-limitations)
- [Links](#links)

---

## What it does

**Recipe discovery** — Search recipes by name, filter by category, cuisine and
main ingredient — all at once, combined as an AND — and browse a randomised
selection on first load. Results from
the public API and recipes you wrote yourself appear in the same grid, with a
toggle to narrow to either.

**Recipe details** — A dedicated page per recipe showing the full ingredient
list with amounts, instructions split into numbered steps, tags, and links to
the original source or video. Ingredients can be ticked off as you gather them.

**Recipe management** — Create your own recipes through a validated form
(reorderable ingredient rows, live validation, image preview), edit them, and
delete them with a confirmation step. Deleting also clears the recipe from your
favourites and from any day it was planned for.

**Favourites** — Save any recipe from a card or the details page, filter and
sort the saved list, and undo an accidental removal from the toast that appears.

**Weekly meal planner** — A 7 × 3 grid of days and meals. Assign a recipe by
clicking an empty slot and picking from your favourites, your own recipes, or a
live search; or drag a recipe card straight onto a slot. Planned meals can be
replaced, removed, or copied out as plain text.

---

## Quick start

Requires **Node.js 20 or newer** (developed on Node 26) and npm 10+.

```bash
# 1. Build the component library
cd recipe-ui
npm install
npm run build

# 2. Install and run the application
cd ../recipe-app
npm install
npm run dev
```

Open <http://localhost:5173>.

> **On the library dependency.** `recipe-app` installs
> `@iosdev_89/recipe-ui` from the npm registry, not from the local folder — so
> `npm install` in `recipe-app/` alone is enough to run the application. Step 1
> above is only needed if you intend to modify the library; to develop the two
> together, point the app back at the local build with
> `npm install file:../recipe-ui`.

---

## Running the development servers

### The application

```bash
cd recipe-app
npm run dev              # http://localhost:5173
npm run dev -- --open    # and open a browser
npm run dev -- --host    # expose on the local network
```

### The component library

```bash
cd recipe-ui
npm start                # dev server with the component gallery
```

The gallery renders every component in isolation and logs each emitted event to
the browser console — the fastest way to check an event payload while working on
a component.

To work on both at once, run `npm start` in `recipe-ui/` (it rebuilds on save)
and `npm run dev` in `recipe-app/` in a second terminal.

---

## Project structure

```
recipe-ui/
├── src/
│   ├── components/
│   │   ├── recipe-card/          Recipe summary card
│   │   ├── recipe-search-bar/    Debounced search with a filter slot
│   │   ├── rating-stars/         Read-only or interactive star rating
│   │   ├── ingredient-list/      Ingredient checklist
│   │   ├── meal-slot/            One planner cell, also a drop target
│   │   └── modal-dialog/         Modal built on the native <dialog>
│   ├── global/theme.css          Design tokens
│   ├── index.html                Local component gallery
│   └── index.ts                  Public entry point and exported types
└── stencil.config.ts

recipe-app/
├── src/
│   ├── lib/
│   │   ├── api/themealdb.ts      API client and response normalisation
│   │   ├── state/                Rune-backed stores, persisted to localStorage
│   │   │   ├── favorites.svelte.ts
│   │   │   ├── my-recipes.svelte.ts
│   │   │   ├── meal-plan.svelte.ts
│   │   │   ├── ratings.svelte.ts
│   │   │   └── toasts.svelte.ts
│   │   ├── components/           Svelte components (grid, form, toaster…)
│   │   ├── stencil.ts            Registers the web components, once
│   │   ├── storage.ts            SSR-safe localStorage helpers
│   │   ├── types.ts              Domain types
│   │   └── validation.ts         Recipe form validation
│   ├── routes/
│   │   ├── +layout.svelte        Shell, navigation, toasts
│   │   ├── +page.svelte          Discover
│   │   ├── recipes/[id]/         Recipe details
│   │   ├── favorites/            Saved recipes
│   │   ├── my-recipes/           List, /new, /[id]/edit
│   │   ├── planner/              Weekly planner
│   │   └── about/                Data and storage information
│   ├── app.css                   Global styles and design tokens
│   └── app.d.ts                  TypeScript types for the custom elements
└── vite.config.ts                SvelteKit + adapter-static configuration
```

---

## The component library

Six web components, compiled by Stencil to standard Custom Elements. They carry
no framework runtime, so the same package works in React, Angular, Vue, or plain
HTML.

| Tag | Key props | Events | Slots |
| --- | --- | --- | --- |
| `<recipe-card>` | `recipe-id`, `name`, `image`, `category`, `area`, `tags`, `favorite`, `rating`, `authored`, `compact` | `recipeSelect`, `favoriteToggle` | `badge`, default, `actions` |
| `<recipe-search-bar>` | `placeholder`, `value`, `debounce`, `submit-label`, `loading` | `searchInput`, `searchSubmit`, `searchClear` | `filters`, default |
| `<rating-stars>` | `value`, `max`, `readonly`, `show-value`, `size` | `ratingChange` | — |
| `<ingredient-list>` | `items`, `heading`, `checkable`, `columns` | `ingredientCheck` | `header`, default |
| `<meal-slot>` | `day`, `meal`, `recipe-id`, `recipe-name`, `recipe-image`, `recipe-meta`, `highlighted` | `mealAssign`, `mealRemove`, `mealOpen`, `mealDrop` | `empty`, default |
| `<modal-dialog>` | `open`, `heading`, `subheading`, `width`, `persistent`, `hide-close` | `dialogClose`, `dialogOpen` | `header`, default, `footer` |

Full per-component API tables are generated from the source on every build and
live next to each component, e.g.
`recipe-ui/src/components/recipe-card/readme.md`.

### Theming

Every colour, radius and spacing value resolves from a `--ru-*` custom property
with a built-in fallback. The application sets these once in
`recipe-app/src/app.css`, and they cross the Shadow DOM boundary — which is why
the Stencil components and the Svelte markup look like one design system without
duplicated CSS. A dark palette ships by default via `prefers-color-scheme`.

---

## SvelteKit ↔ Stencil integration

The four integration requirements, and where each is implemented.

### 1. Registering the components

`recipe-app/src/lib/stencil.ts` loads the package's `defineCustomElements`
entry point dynamically and only in the browser, since custom element
registration needs a real DOM. The promise is memoised so registration happens
exactly once per page load, no matter how many components ask for it. The root
layout calls it in `onMount`.

### 2. Passing data down as component properties

Primitive props pass as kebab-case attributes, which Stencil maps back to
camelCase properties:

```svelte
<recipe-card
  recipe-id={recipe.id}
  name={recipe.name}
  favorite={favorites.has(recipe.id)}
  authored={recipe.origin === 'local'}
/>
```

An **attribute can only carry a string**, so structured data is set as a DOM
property instead. `recipe-app/src/routes/recipes/[id]/+page.svelte` binds the
element and assigns the array in an effect, which also guarantees the element
has been upgraded before the write:

```svelte
<script>
  let ingredientListEl = $state();

  $effect(() => {
    if (ingredientListEl && recipe) {
      ingredientListEl.items = recipe.ingredients;   // a real array, not a string
    }
  });
</script>

<ingredient-list bind:this={ingredientListEl} heading="Ingredients" checkable />
```

### 3. Handling custom events

Stencil emits `CustomEvent`s that bubble and compose. Svelte 5 preserves the
case of an `on*` attribute, so `onrecipeSelect` registers a listener for the
`recipeSelect` event:

```svelte
<recipe-card
  onrecipeSelect={(event) => goto(`/recipes/${event.detail.recipeId}`)}
  onfavoriteToggle={(event) => favorites.toggle(find(event.detail.recipeId))}
/>
```

Handled events, by route:

| Event | Handled in | Effect |
| --- | --- | --- |
| `recipeSelect` | `RecipeGrid.svelte` | Navigate to the details page |
| `favoriteToggle` | `RecipeGrid.svelte` | Toggle the favourites store, with undo |
| `searchInput` / `searchSubmit` / `searchClear` | `routes/+page.svelte` | Run or reset the search |
| `ingredientCheck` | `routes/recipes/[id]` | Track gathered ingredients |
| `ratingChange` | `routes/recipes/[id]` | Persist a personal rating |
| `mealAssign` | `routes/planner` | Open the recipe picker |
| `mealOpen` | `routes/planner` | Navigate to the planned recipe |
| `mealRemove` | `routes/planner` | Clear the slot, with undo |
| `mealDrop` | `routes/planner` | Assign a dragged recipe |
| `dialogClose` | every route using a dialog | Close the dialog |

`recipe-app/src/app.d.ts` declares the props and event payload types for all six
tags, so a mistyped prop or a wrong `event.detail` shape is a `svelte-check`
error rather than a silent no-op at runtime.

### 4. Using slots

| Slot | Used in | Content projected |
| --- | --- | --- |
| `recipe-search-bar[slot=filters]` | Discover page | Category, cuisine and ingredient filters, source toggle |
| `recipe-search-bar` (default) | Discover page | Live result count |
| `recipe-card[slot=badge]` | `RecipeGrid` | "Drag to plan" hint when draggable |
| `ingredient-list` (default) | Recipe details | Progress note under the checklist |
| `modal-dialog[slot=footer]` | Details, planner, favourites, my recipes, about | Dialog action buttons |

### Control stays with the application

The components are deliberately stateless about anything the app owns.
`<recipe-card favorite>` is controlled by the favourites store;
`<modal-dialog open>` is controlled by the route. A dialog never closes itself —
it emits `dialogClose` and the route decides. That keeps a single source of
truth and makes every component reusable in a different application with
different rules.

---

## Publishing to npm

The library is published under a scope, with `publishConfig.access` set to
`public` so a scoped package is publicly installable.

```bash
cd recipe-ui

# 1. Authenticate (run this yourself — it prompts for credentials)
npm login

# 2. Confirm what will ship: dist/, loader/, README.md, LICENSE only
npm pack --dry-run

# 3. Bump the version, then publish
npm version patch        # or minor / major
npm publish
```

`prepublishOnly` rebuilds the package before it goes out, so a stale `dist/` can
never be published.

### Versioning

Standard [semantic versioning](https://semver.org/):

| Change | Bump | Example |
| --- | --- | --- |
| Bug fix, styling correction, no API change | `patch` | 0.1.0 → 0.1.1 |
| New component, new optional prop or event | `minor` | 0.1.1 → 0.2.0 |
| Renamed or removed prop/event, changed payload | `major` | 0.2.0 → 1.0.0 |

### Switching the app to the published package

This is already done: `recipe-app/package.json` depends on
`"@iosdev_89/recipe-ui": "^0.1.0"`, resolved from the registry. To repeat it
after a future publish:

```bash
cd recipe-app
npm install @iosdev_89/recipe-ui@latest
```

No source file changes are needed — every import already uses the package name,
so the same specifier works whether it resolves to the registry or a local
folder.

---

## Building for production

```bash
cd recipe-ui  && npm run build    # compiles the library to dist/ and loader/
cd ../recipe-app && npm run build # emits recipe-app/build/
npm run preview                   # serve that build locally
```

`recipe-app/build/` is a self-contained folder of static files.

---

## Deployment

The application builds to static files with `@sveltejs/adapter-static`, so it
can be served by any static host or plain file server. To check the production
build locally:

```bash
cd recipe-app
npm run build
npm run preview
```

Because it is a single-page application, a host must be configured to serve
`index.html` for unknown paths so that deep links such as `/recipes/52771`
resolve. Most static hosts do this automatically for SPA builds; where it is
configurable, the setting is usually called a *fallback* or *rewrite* rule.

---

## Testing and quality checks

```bash
cd recipe-ui
npm test                 # 34 unit tests across the six components

cd ../recipe-app
npm run check            # svelte-check: types, a11y, unused code
npm run build            # compile check
```

The library's tests cover rendering, prop parsing, event payloads, and the
control-flow contracts — for example that `<recipe-card>`'s favourite button
does not also trigger a card selection, that `<ingredient-list>` degrades to an
empty list on malformed JSON rather than throwing, and that `<modal-dialog>`
lets clicks from slotted content keep bubbling.

---

## Assumptions

These were decisions made where the brief left room, and the reasoning behind
each.

1. **TheMealDB is the recipe API.** It is free, needs no API key and no account,
   and imposes no rate limit that a reviewer would hit. Anyone can clone the
   repository and run the app immediately, with no secrets to distribute.

2. **All user data is stored in the browser.** Favourites, user-created recipes,
   ratings and the weekly plan live in `localStorage` under the
   `recipe-planner:` prefix. The brief describes no authentication or backend,
   and a server would add infrastructure without adding function. The trade-off:
   data does not follow the user across browsers or devices, which the About
   page states plainly, and where a JSON backup can be downloaded.

3. **The app is client-rendered.** Since all state is in `localStorage` and all
   recipe data is fetched from the browser, there is nothing for a server to
   render — SSR would emit an empty shell that the client immediately replaces.
   Turning it off lets the production build be a folder of static files. This is
   set in `recipe-app/src/routes/+layout.ts`.

4. **User recipes and API recipes are one type.** Both normalise to the same
   `Recipe` shape, distinguished only by an `origin` field and a `local-` id
   prefix. One card, one details page and one planner slot therefore render both
   without branching. Only `local` recipes are editable, since the API is
   read-only.

5. **A week is seven days by three meals.** Breakfast, lunch and dinner, Monday
   to Sunday — 21 slots. The plan is a single recurring week rather than a
   calendar of dated weeks, which is the lighter reading of "a weekly meal plan".

6. **Ratings are private notes.** TheMealDB has no rating endpoint, so the star
   rating on the details page is the user's own score, stored locally and never
   sent anywhere.

7. **The components are controlled.** Props such as `favorite` and `open` are
   owned by the application; components report intent through events instead of
   changing their own state. This keeps one source of truth and makes the
   library reusable under different rules.

8. **Validation is client-side.** There is no server to validate against. The
   same `validateRecipe` function backs both the create and the edit form, so
   the two cannot drift apart.

---

## Known limitations

- **Combined filters cost extra requests.** TheMealDB has no combined-filter
  endpoint — `filter.php` handles one of category, cuisine or ingredient per
  request. The app works around this by requesting each active filter in
  parallel and intersecting the returned id sets, so filters do genuinely
  combine, at the cost of one request per active filter (two or three, not one
  per result). A text query takes a different path, since `search.php` returns
  complete recipes that can be filtered directly.
- **Filter results are sparse.** The `filter.php` endpoints return only an id,
  name and thumbnail, so cards from a category or cuisine filter show no
  category chip until the recipe is opened. This is preserved in the types
  (`RecipeSummary` vs `Recipe`) rather than hidden behind empty strings.
- **Drag and drop needs a pointer.** Planner slots are also click-to-assign and
  fully keyboard operable, so dragging is an enhancement rather than the only
  route.
- **No cross-device sync.** By design — see assumption 2.

---

## Links

- **GitHub repository:**
  <https://github.com/Abhishek89310/svelte-stencil-recipe-planner>
- **npm package:**
  <https://www.npmjs.com/package/@iosdev_89/recipe-ui>
- **Deployed application:** _to be added_
- **Recipe data:** [TheMealDB](https://www.themealdb.com/api.php)

---

## License

MIT
