# recipe-search-bar



<!-- Auto Generated Below -->


## Overview

A debounced search field with an optional filter tray.

Two events are emitted deliberately: `searchInput` fires on every debounced
keystroke so a consumer can drive live results, while `searchSubmit` fires
only on Enter or the button. Consumers pick whichever suits their API budget.

## Properties

| Property      | Attribute      | Description                                                                  | Type      | Default               |
| ------------- | -------------- | ---------------------------------------------------------------------------- | --------- | --------------------- |
| `debounce`    | `debounce`     | Milliseconds to wait after the last keystroke before emitting `searchInput`. | `number`  | `350`                 |
| `disabled`    | `disabled`     | Disables the whole control.                                                  | `boolean` | `false`               |
| `loading`     | `loading`      | Shows a spinner in place of the search icon.                                 | `boolean` | `false`               |
| `placeholder` | `placeholder`  | Placeholder text for the input.                                              | `string`  | `'Search recipes...'` |
| `submitLabel` | `submit-label` | Text of the submit button. Set to an empty string to hide the button.        | `string`  | `'Search'`            |
| `value`       | `value`        | Controlled value. Updating it from the consumer resets the internal draft.   | `string`  | `''`                  |


## Events

| Event          | Description                                                       | Type                        |
| -------------- | ----------------------------------------------------------------- | --------------------------- |
| `searchClear`  | Fired when the clear button empties the field.                    | `CustomEvent<void>`         |
| `searchInput`  | Fired after the debounce window closes on each edit.              | `CustomEvent<SearchDetail>` |
| `searchSubmit` | Fired when the user presses Enter or activates the submit button. | `CustomEvent<SearchDetail>` |


## Slots

| Slot        | Description                                                 |
| ----------- | ----------------------------------------------------------- |
|             | Rendered after the filter tray, e.g. a result count line.   |
| `"filters"` | Rendered under the input, intended for select/chip filters. |


## Shadow Parts

| Part      | Description |
| --------- | ----------- |
| `"input"` |             |


----------------------------------------------


