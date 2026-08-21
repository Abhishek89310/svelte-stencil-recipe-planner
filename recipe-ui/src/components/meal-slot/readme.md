# meal-slot



<!-- Auto Generated Below -->


## Overview

One cell of the weekly meal planner grid.

The slot is both a drop target (for drag-and-drop planning) and a plain
button (for click-to-assign), so the planner stays usable with a keyboard
and on touch devices where dragging is awkward.

## Properties

| Property            | Attribute        | Description                                                                 | Type      | Default            |
| ------------------- | ---------------- | --------------------------------------------------------------------------- | --------- | ------------------ |
| `day` _(required)_  | `day`            | Day key, e.g. "Monday". Echoed back in every event.                         | `string`  | `undefined`        |
| `dropMimeType`      | `drop-mime-type` | MIME type read from the drag payload. Must match what the drag source sets. | `string`  | `'text/recipe-id'` |
| `highlighted`       | `highlighted`    | Highlights the slot, e.g. for the current day.                              | `boolean` | `false`            |
| `meal` _(required)_ | `meal`           | Meal key, e.g. "Breakfast". Echoed back in every event.                     | `string`  | `undefined`        |
| `recipeId`          | `recipe-id`      | Id of the assigned recipe. Leave unset to render the empty state.           | `string`  | `undefined`        |
| `recipeImage`       | `recipe-image`   | Thumbnail of the assigned recipe.                                           | `string`  | `undefined`        |
| `recipeMeta`        | `recipe-meta`    | Secondary line under the title, e.g. the category.                          | `string`  | `undefined`        |
| `recipeName`        | `recipe-name`    | Title of the assigned recipe.                                               | `string`  | `undefined`        |


## Events

| Event        | Description                                                              | Type                          |
| ------------ | ------------------------------------------------------------------------ | ----------------------------- |
| `mealAssign` | Fired when an empty slot is activated, asking the host to open a picker. | `CustomEvent<MealSlotDetail>` |
| `mealDrop`   | Fired when a recipe is dropped onto the slot.                            | `CustomEvent<MealDropDetail>` |
| `mealOpen`   | Fired when a filled slot's body is activated, to open the recipe.        | `CustomEvent<MealSlotDetail>` |
| `mealRemove` | Fired when the remove button on a filled slot is activated.              | `CustomEvent<MealSlotDetail>` |


## Slots

| Slot      | Description                                 |
| --------- | ------------------------------------------- |
|           | Extra content rendered under a filled slot. |
| `"empty"` | Replaces the default empty-state content.   |


----------------------------------------------


