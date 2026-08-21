# ingredient-list



<!-- Auto Generated Below -->


## Overview

Renders an ingredient checklist.

`items` accepts either a real array (set as a DOM property, which is how
SvelteKit binds it) or a JSON string (useful from plain HTML). Parsing both
shapes keeps the component honest in either environment.

## Properties

| Property    | Attribute   | Description                                                                   | Type                     | Default         |
| ----------- | ----------- | ----------------------------------------------------------------------------- | ------------------------ | --------------- |
| `checkable` | `checkable` | When true each row gets a checkbox and emits `ingredientCheck`.               | `boolean`                | `false`         |
| `columns`   | `columns`   | Renders the list in two columns on wide viewports.                            | `boolean`                | `false`         |
| `heading`   | `heading`   | Heading text shown above the list.                                            | `string`                 | `'Ingredients'` |
| `items`     | `items`     | Ingredients as an array of `{ name, measure }`, or a JSON string of the same. | `Ingredient[] \| string` | `[]`            |


## Events

| Event             | Description                            | Type                                 |
| ----------------- | -------------------------------------- | ------------------------------------ |
| `ingredientCheck` | Fired when a checkable row is toggled. | `CustomEvent<IngredientCheckDetail>` |


## Slots

| Slot       | Description                                                        |
| ---------- | ------------------------------------------------------------------ |
|            | Rendered under the list, e.g. a "add all to shopping list" button. |
| `"header"` | Replaces the default heading row.                                  |


----------------------------------------------


