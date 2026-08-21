# Recipe Finder & Meal Planner — application

The SvelteKit half of the project. For the full picture — architecture, the
integration contract with the component library, publishing and assumptions —
see the [root README](../README.md).

## Requirements

- Node.js 20 or newer
- The component library built at least once (`cd ../recipe-ui && npm run build`)

## Commands

```bash
npm install
npm run dev       # development server on http://localhost:5173
npm run build     # production build into build/
npm run preview   # serve the production build
npm run check     # svelte-check: types and accessibility
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Discover — search, filter and browse |
| `/recipes/[id]` | Recipe details |
| `/favorites` | Saved recipes |
| `/my-recipes` | Your own recipes |
| `/my-recipes/new` | Create a recipe |
| `/my-recipes/[id]/edit` | Edit a recipe |
| `/planner` | Weekly meal planner |
| `/about` | Data, storage keys, backup and reset |

## Stored data

Everything the app remembers lives in this browser's `localStorage`:

| Key | Contents |
| --- | --- |
| `recipe-planner:favorites` | Saved recipes |
| `recipe-planner:my-recipes` | Recipes you wrote |
| `recipe-planner:meal-plan` | The weekly plan |
| `recipe-planner:ratings` | Your personal ratings |

The About page can export all of it as JSON, or clear it.

## State management

State lives in rune-backed singleton classes under `src/lib/state/`, each
mirrored to `localStorage` through a single `$effect`. Reading `favorites.items`
in a component registers the dependency; any mutation re-renders every reader.
Because persistence is one effect per store rather than a write in each method,
no code path can change the data and forget to save it.
