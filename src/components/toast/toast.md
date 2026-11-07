<!-- Generated from Figma by scripts/code-generator.cjs. Edits here are overwritten on the next Figma sync. -->
# Toast

> Last synced from Figma: 2026-11-07T18:42:32.836Z

## Description

_No description set in Figma._

## Figma source

| Field | Value |
| --- | --- |
| Figma name | Toast |
| Node ID | 4235:1824 |
| Node type | COMPONENT_SET |
| Page | Toast |

## Component properties

| Property | Type | Default | Options |
| --- | --- | --- | --- |
| appearance | VARIANT | Default | Default, Solid |
| content | TEXT | I am a toast | — |
| leadingIcon | BOOLEAN | true | — |
| linkButton | BOOLEAN | true | — |
| trailingArea | BOOLEAN | true | — |
| trailingIcon | BOOLEAN | true | — |
| type | VARIANT | Info | Info, Highlight, Neutral, Warning, Error, Success |

## Base specs

| Spec | Value |
| --- | --- |
| Width × Height | 300px × 36px |
| Padding (T R B L) | 8px 12px 8px 12px |
| Gap (item spacing) | 8px |
| Corner radius | 8px |
| Layout mode | HORIZONTAL |
| Font size | 12px |
| Label text | I am a toast |
| Background | #F3F6FD |
| Text color | #1C3FCA |
| Border color | — |

## Variants (12)

| Variant | W × H | Padding (T R B L) | Gap | Radius | Font size | Background | Text | Border |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| type=Error, appearance=Default | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #FDF1F4 | #A30F3B | — |
| type=Error, appearance=Solid | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #D61C53 | #FFFFFF | — |
| type=Highlight, appearance=Default | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #F4F0FF | #5236C9 | — |
| type=Highlight, appearance=Solid | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #7454F2 | #FFFFFF | — |
| type=Info, appearance=Default | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #F3F6FD | #1C3FCA | — |
| type=Info, appearance=Solid | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #1C3FCA | #FFFFFF | — |
| type=Neutral, appearance=Default | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #F5F5F5 | #383838 | — |
| type=Neutral, appearance=Solid | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #383838 | #FFFFFF | — |
| type=Success, appearance=Default | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #EFFAF2 | #076246 | — |
| type=Success, appearance=Solid | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #00815A | #FFFFFF | — |
| type=Warning, appearance=Default | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #FEFAEC | #804006 | — |
| type=Warning, appearance=Solid | 300px × 36px | 8px 12px 8px 12px | 8px | 8px | 12px | #B65805 | #FFFFFF | — |

## Code files

- `toast.tsx` — React component
- `toast.types.ts` — React prop types
- `toast.scss` — Styles (token variables only)
- `toast.dart` — Flutter widget
