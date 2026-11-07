<!-- Generated from Figma by scripts/code-generator.cjs. Edits here are overwritten on the next Figma sync. -->
# Snackbar

> Last synced from Figma: 2026-11-07T18:42:33.578Z

## Description

_No description set in Figma._

## Figma source

| Field | Value |
| --- | --- |
| Figma name | Snackbar |
| Node ID | 3612:11390 |
| Node type | COMPONENT_SET |
| Page | Snackbar |

## Component properties

| Property | Type | Default | Options |
| --- | --- | --- | --- |
| configuration | VARIANT | SIngel line | SIngel line, Double line, Lengthy text |
| leadingIcon | BOOLEAN | true | — |
| linkButton | BOOLEAN | true | — |
| trailingIcon | BOOLEAN | false | — |

## Base specs

| Spec | Value |
| --- | --- |
| Width × Height | 320px × 48px |
| Padding (T R B L) | 4px 12px 4px 12px |
| Gap (item spacing) | 8px |
| Corner radius | 8px |
| Layout mode | HORIZONTAL |
| Font size | 16px |
| Label text | Single line message |
| Background | #111111 |
| Text color | #FFFFFF |
| Border color | — |

## Variants (3)

| Variant | W × H | Padding (T R B L) | Gap | Radius | Font size | Background | Text | Border |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| configuration=Double line | 320px × 64px | 12px 16px 12px 16px | 8px | 8px | 16px | #111111 | #FFFFFF | — |
| configuration=Lengthy text | 320px × 136px | 12px 16px 12px 16px | 8px | 8px | 16px | #111111 | #FFFFFF | — |
| configuration=SIngel line | 320px × 48px | 4px 12px 4px 12px | 8px | 8px | 16px | #111111 | #FFFFFF | — |

## Code files

- `snackbar.tsx` — React component
- `snackbar.types.ts` — React prop types
- `snackbar.scss` — Styles (token variables only)
- `snackbar.dart` — Flutter widget
