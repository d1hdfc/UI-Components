# Button

Buttons trigger an action, such as submitting a form or moving to the next step.
Use the variant that reflects the importance of the action.

## Import

```tsx
import { Button } from './components/Button';
```

## Example

```tsx
<Button variant="primary" size="medium">
  Submit
</Button>
```

## Variants

`primary`, `secondary`, `tertiary`, and `link`.

## Sizes

`large`, `medium`, `small`, and `xsmall`.

## States

Buttons support default, hover, selected, disabled, and loading states. Use the
`selected` prop for a toggle button; it exposes the state through `aria-pressed`.

## API

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `primary \| secondary \| tertiary \| link` | `primary` |
| `size` | `large \| medium \| small \| xsmall` | `medium` |
| `leftIcon`, `rightIcon` | `boolean \| ReactNode` | `false` |
| `loading` | `boolean` | `false` |
| `selected` | `boolean` | `false` |
| `fullWidth` | `boolean` | `false` |
