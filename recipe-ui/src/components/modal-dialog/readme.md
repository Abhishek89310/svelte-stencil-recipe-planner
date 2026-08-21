# modal-dialog



<!-- Auto Generated Below -->


## Overview

An accessible modal built on the native `<dialog>` element.

Delegating to `<dialog>` buys focus trapping, the top layer, inert background
content and Escape handling from the platform rather than re-implementing
them. `open` stays the source of truth: closing always routes through
`dialogClose` so the consumer's state and the DOM cannot drift apart.

## Properties

| Property     | Attribute    | Description                                                 | Type      | Default   |
| ------------ | ------------ | ----------------------------------------------------------- | --------- | --------- |
| `heading`    | `heading`    | Text of the default heading.                                | `string`  | `''`      |
| `hideClose`  | `hide-close` | Hides the built-in close button, e.g. for a forced choice.  | `boolean` | `false`   |
| `open`       | `open`       | Controls visibility. The component never flips this itself. | `boolean` | `false`   |
| `persistent` | `persistent` | When true, clicking the backdrop does not request a close.  | `boolean` | `false`   |
| `subheading` | `subheading` | Supporting line under the heading.                          | `string`  | `''`      |
| `width`      | `width`      | Max width of the dialog panel, as any CSS length.           | `string`  | `'560px'` |


## Events

| Event         | Description                                                             | Type                |
| ------------- | ----------------------------------------------------------------------- | ------------------- |
| `dialogClose` | Fired whenever a close is requested: button, Escape, or backdrop click. | `CustomEvent<void>` |
| `dialogOpen`  | Fired once the dialog has finished opening.                             | `CustomEvent<void>` |


## Methods

### `requestClose() => Promise<void>`

Imperatively request a close, emitting `dialogClose`.

#### Returns

Type: `Promise<void>`




## Slots

| Slot       | Description                                    |
| ---------- | ---------------------------------------------- |
|            | Dialog body content.                           |
| `"footer"` | Action row pinned to the bottom of the dialog. |
| `"header"` | Replaces the default heading.                  |


----------------------------------------------


