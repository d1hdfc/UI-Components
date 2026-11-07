<!-- Generated from Figma by scripts/code-generator.cjs. Edits here are overwritten on the next Figma sync. -->
# LeadingAreaMedium

> Last synced from Figma: 2026-11-07T18:42:32.345Z

## Description

_No description set in Figma._

## Figma source

| Field | Value |
| --- | --- |
| Figma name | Leading Area \| Medium |
| Node ID | 2690:3046 |
| Node type | COMPONENT_SET |
| Page | Text-input |

## Component properties

| Property | Type | Default | Options |
| --- | --- | --- | --- |
| content | VARIANT | Only Label | Input + Label, Only Label |
| countryCode | BOOLEAN | true | — |
| currency | BOOLEAN | true | — |
| inputText | TEXT | Input text | — |
| label  | BOOLEAN | true | — |
| labelText | TEXT | Label | — |
| leadingIcon | BOOLEAN | true | — |
| type | VARIANT | Normal | Normal, PAN, Aadhaar, DOB, Debit/Credit Card, Mobile No, Income, OTP (4), OTP (6) |

## Base specs

| Spec | Value |
| --- | --- |
| Width × Height | 225px × 24px |
| Padding (T R B L) | 0px 0px 0px 4px |
| Gap (item spacing) | 12px |
| Corner radius | 0px |
| Layout mode | HORIZONTAL |
| Font size | 18px |
| Label text | Input text |
| Background | — |
| Text color | #111111 |
| Border color | — |

## Variants (18)

| Variant | W × H | Padding (T R B L) | Gap | Radius | Font size | Background | Text | Border |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| type=Aadhaar, content=Input + Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 18px | — | #111111 | — |
| type=Aadhaar, content=Only Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 18px | — | #444444 | — |
| type=Debit/Credit Card, content=Input + Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 18px | — | #111111 | — |
| type=Debit/Credit Card, content=Only Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 18px | — | #444444 | — |
| type=DOB, content=Input + Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 18px | — | #111111 | — |
| type=DOB, content=Only Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 18px | — | #444444 | — |
| type=Income, content=Input + Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 20px | — | #5C6172 | — |
| type=Income, content=Only Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 20px | — | #5C6172 | — |
| type=Mobile No, content=Input + Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 20px | — | #5C6172 | — |
| type=Mobile No, content=Only Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 20px | — | #5C6172 | — |
| type=Normal, content=Input + Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 18px | — | #111111 | — |
| type=Normal, content=Only Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 18px | — | #444444 | — |
| type=OTP (4), content=Input + Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 36px | — | #111111 | — |
| type=OTP (4), content=Only Label | 225px × 20px | 0px 0px 0px 4px | 12px | 0px | 36px | — | #D9D9D9 | — |
| type=OTP (6), content=Input + Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 36px | — | #111111 | — |
| type=OTP (6), content=Only Label | 225px × 20px | 0px 0px 0px 4px | 12px | 0px | 36px | — | #D9D9D9 | — |
| type=PAN, content=Input + Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 18px | — | #111111 | — |
| type=PAN, content=Only Label | 225px × 24px | 0px 0px 0px 4px | 12px | 0px | 18px | — | #444444 | — |

## Code files

- `leading-area-medium.tsx` — React component
- `leading-area-medium.types.ts` — React prop types
- `leading-area-medium.scss` — Styles (token variables only)
- `leading-area-medium.dart` — Flutter widget
