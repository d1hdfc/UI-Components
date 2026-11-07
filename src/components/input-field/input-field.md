<!-- Generated from Figma by scripts/code-generator.cjs. Edits here are overwritten on the next Figma sync. -->
# InputField

> Last synced from Figma: 2026-11-07T18:42:32.295Z

## Description

_No description set in Figma._

## Figma source

| Field | Value |
| --- | --- |
| Figma name | Input Field |
| Node ID | 4276:35339 |
| Node type | COMPONENT_SET |
| Page | Testing |

## Component properties

| Property | Type | Default | Options |
| --- | --- | --- | --- |
| helperText | BOOLEAN | true | — |
| size | VARIANT | Small | Small, Medium |
| states | VARIANT | Inactive | Inactive, Focus, Active, Disabled, Error, Success, Loading, Read Only |
| trailingArea | BOOLEAN | true | — |

## Base specs

| Spec | Value |
| --- | --- |
| Width × Height | 320px × 76px |
| Padding (T R B L) | 0px 0px 0px 0px |
| Gap (item spacing) | 8px |
| Corner radius | 0px |
| Layout mode | VERTICAL |
| Font size | 14px |
| Label text | Label |
| Background | — |
| Text color | #D9D9D9 |
| Border color | — |

## Variants (16)

| Variant | W × H | Padding (T R B L) | Gap | Radius | Font size | Background | Text | Border |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| states=Active, size=Medium | 360px × 94px | 0px 0px 0px 0px | 12px | 0px | 18px | — | #111111 | — |
| states=Active, size=Small | 320px × 76px | 0px 0px 0px 0px | 8px | 0px | 14px | — | #111111 | — |
| states=Disabled, size=Medium | 360px × 94px | 0px 0px 0px 0px | 12px | 0px | 18px | — | #D9D9D9 | — |
| states=Disabled, size=Small | 320px × 76px | 0px 0px 0px 0px | 8px | 0px | 14px | — | #D9D9D9 | — |
| states=Error, size=Medium | 360px × 94px | 0px 0px 0px 0px | 12px | 0px | 18px | — | #111111 | — |
| states=Error, size=Small | 320px × 76px | 0px 0px 0px 0px | 8px | 0px | 14px | — | #111111 | — |
| states=Focus, size=Medium | 360px × 94px | 0px 0px 0px 0px | 12px | 0px | 18px | — | #111111 | — |
| states=Focus, size=Small | 320px × 76px | 0px 0px 0px 0px | 8px | 0px | 14px | — | #111111 | — |
| states=Inactive, size=Medium | 360px × 94px | 0px 0px 0px 0px | 12px | 0px | 18px | — | #D9D9D9 | — |
| states=Inactive, size=Small | 320px × 76px | 0px 0px 0px 0px | 8px | 0px | 14px | — | #D9D9D9 | — |
| states=Loading, size=Medium | 360px × 94px | 0px 0px 0px 0px | 12px | 0px | 18px | — | #111111 | — |
| states=Loading, size=Small | 320px × 76px | 0px 0px 0px 0px | 8px | 0px | 14px | — | #111111 | — |
| states=Read Only, size=Medium | 360px × 44px | 0px 0px 0px 0px | 8px | 0px | 18px | — | #111111 | — |
| states=Read Only, size=Small | 320px × 36px | 0px 0px 0px 0px | 8px | 0px | 14px | — | #111111 | — |
| states=Success, size=Medium | 360px × 94px | 0px 0px 0px 0px | 12px | 0px | 18px | — | #111111 | — |
| states=Success, size=Small | 320px × 76px | 0px 0px 0px 0px | 8px | 0px | 14px | — | #111111 | — |

## Code files

- `input-field.tsx` — React component
- `input-field.types.ts` — React prop types
- `input-field.scss` — Styles (token variables only)
- `input-field.dart` — Flutter widget
