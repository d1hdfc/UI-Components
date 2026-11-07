<!-- Generated from Figma by scripts/code-generator.cjs. Edits here are overwritten on the next Figma sync. -->
# LeadingAreaSmall

> Last synced from Figma: 2026-11-07T18:42:32.312Z

## Description

_No description set in Figma._

## Figma source

| Field | Value |
| --- | --- |
| Figma name | Leading Area \| Small |
| Node ID | 2690:2834 |
| Node type | COMPONENT_SET |
| Page | Text-input |

## Component properties

| Property | Type | Default | Options |
| --- | --- | --- | --- |
| content | VARIANT | Label only | Input + Label, Label only |
| countryCode | BOOLEAN | true | — |
| currency | BOOLEAN | true | — |
| inputText | TEXT | Input text | — |
| label  | BOOLEAN | true | — |
| labelText | TEXT | Label | — |
| leadingIcon | BOOLEAN | true | — |
| type | VARIANT | Normal | Normal, PAN, Aadhaar, Date of birth, Debit/Credit Card, Mobile number, Income, OTP (4), OTP (6) |

## Base specs

| Spec | Value |
| --- | --- |
| Width × Height | 199px × 20px |
| Padding (T R B L) | 0px 0px 0px 4px |
| Gap (item spacing) | 8px |
| Corner radius | 0px |
| Layout mode | HORIZONTAL |
| Font size | 14px |
| Label text | Input text |
| Background | — |
| Text color | #111111 |
| Border color | — |

## Variants (18)

| Variant | W × H | Padding (T R B L) | Gap | Radius | Font size | Background | Text | Border |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| type=Aadhaar, content=Input + Label | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 14px | — | #111111 | — |
| type=Aadhaar, content=Label only | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 14px | — | #444444 | — |
| type=Date of birth, content=Input + Label | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 14px | — | #111111 | — |
| type=Date of birth, content=Label only | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 14px | — | #444444 | — |
| type=Debit/Credit Card, content=Input + Label | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 14px | — | #111111 | — |
| type=Debit/Credit Card, content=Label only | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 14px | — | #444444 | — |
| type=Income, content=Input + Label | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 18px | — | #444444 | — |
| type=Income, content=Label only | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 18px | — | #444444 | — |
| type=Mobile number, content=Input + Label | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 18px | — | #444444 | — |
| type=Mobile number, content=Label only | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 18px | — | #444444 | — |
| type=Normal, content=Input + Label | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 14px | — | #111111 | — |
| type=Normal, content=Label only | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 14px | — | #444444 | — |
| type=OTP (4), content=Input + Label | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 28px | — | #111111 | — |
| type=OTP (4), content=Label only | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 28px | — | #D9D9D9 | — |
| type=OTP (6), content=Input + Label | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 28px | — | #111111 | — |
| type=OTP (6), content=Label only | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 28px | — | #D9D9D9 | — |
| type=PAN, content=Input + Label | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 14px | — | #111111 | — |
| type=PAN, content=Label only | 199px × 20px | 0px 0px 0px 4px | 8px | 0px | 14px | — | #444444 | — |

## Code files

- `leading-area-small.tsx` — React component
- `leading-area-small.types.ts` — React prop types
- `leading-area-small.scss` — Styles (token variables only)
- `leading-area-small.dart` — Flutter widget
