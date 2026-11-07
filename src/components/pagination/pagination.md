<!-- Generated from Figma by scripts/code-generator.cjs. Edits here are overwritten on the next Figma sync. -->
# Pagination

> Last synced from Figma: 2026-11-07T18:42:32.681Z

## Description

_No description set in Figma._

## Figma source

| Field | Value |
| --- | --- |
| Figma name | Pagination |
| Node ID | 3557:23311 |
| Node type | COMPONENT_SET |
| Page | Pagination |

## Component properties

| Property | Type | Default | Options |
| --- | --- | --- | --- |
| device | VARIANT | Desktop | Desktop, Mobile |
| pageStatus | VARIANT | First Page | First Page, Last Page, Middle Page |
| shopJumpPage | BOOLEAN | true | — |
| showLeftTruncation | BOOLEAN | true | — |
| showRightTruncation | BOOLEAN | true | — |

## Base specs

| Spec | Value |
| --- | --- |
| Width × Height | 845px × 32px |
| Padding (T R B L) | 0px 0px 0px 0px |
| Gap (item spacing) | 16px |
| Corner radius | 0px |
| Layout mode | HORIZONTAL |
| Font size | 12px |
| Label text | Lisiting per page |
| Background | — |
| Text color | #444444 |
| Border color | — |

## Variants (6)

| Variant | W × H | Padding (T R B L) | Gap | Radius | Font size | Background | Text | Border |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| device=Desktop, pageStatus=First Page | 845px × 32px | 0px 0px 0px 0px | 16px | 0px | 12px | — | #444444 | — |
| device=Desktop, pageStatus=Last Page | 845px × 32px | 0px 0px 0px 0px | 16px | 0px | 12px | — | #444444 | — |
| device=Desktop, pageStatus=Middle Page | 845px × 32px | 0px 0px 0px 0px | 16px | 0px | 12px | — | #444444 | — |
| device=Mobile, pageStatus=First Page | 375px × 64px | 20px 20px 20px 20px | 16px | 0px | 12px | — | #D9D9D9 | #D9D9D9 |
| device=Mobile, pageStatus=Last Page | 375px × 64px | 20px 20px 20px 20px | 16px | 0px | 12px | — | #111111 | #D9D9D9 |
| device=Mobile, pageStatus=Middle Page | 375px × 64px | 20px 20px 20px 20px | 16px | 0px | 12px | — | #111111 | #D9D9D9 |

## Code files

- `pagination.tsx` — React component
- `pagination.types.ts` — React prop types
- `pagination.scss` — Styles (token variables only)
- `pagination.dart` — Flutter widget
