## Overview

Resto Iga Bakar’s digital commerce system is built on a single, almost violently simple culinary rule: **let the food sizzle, the chrome must disappear.** Every page reads as a high-end gastronomic editorial — towering uppercase display lockups (`{typography.display-campaign}`) burned into full-bleed photography of searing meat, wood smoke, and fresh chili, with the interface chrome (navigation, menus, cart buttons, and categories) reduced to neutral typography and clean pill geometry on warm parchment `{colors.canvas}` and slate-stone `{colors.soft-cloud}` surfaces. All chromatic energy is reserved for the food itself, utilizing warm natural tones and spicy accents only for status highlights (sambal price indicator `{colors.sale}`, fresh greens success `{colors.success}`, or spiciness level dots).

The resulting layout feels intensely tactile — rich campaign headers, structured product grids, raw ingredient panels, and solid footers — stacked like a thick printed menu card. Visual density is high but meticulously balanced, utilizing three structural devices: square 1:1 dish photography on warm stone backdrops (`{colors.soft-cloud}`), smooth pill-shaped smoked CTAs (`{rounded.lg}`) anchoring user choices, and a strict 8px-base spacing scale that keeps menu cards, filters, and checkout blocks mathematically aligned.

Across the home page, the interactive menu, the PDP (Product Detail Page) for the signature *Iga Bakar Merapi*, the Cart, and Checkout, the layout chrome remains identical — only the culinary photography and menu item details shift. This is the system's core philosophy: maximum sensory expression in the imagery, maximum mechanical restraint in the UI.

**Key Characteristics:**
- **Gastronomic Hero Banners**: Editorial campaign blocks with `{typography.display-campaign}` (Anton / Bebas Neue, 96px, line-height 0.9, uppercase) burned directly into high-contrast food photography.
- **Organic Charcoal UI Palette**: Deep Smoked Black (`{colors.ink}`), Warm Clay Parchment (`{colors.canvas}`), and Warm Stone (`{colors.soft-cloud}`) cover 95% of the screen area, evoking charcoal grills and premium tableware.
- **Pill Geometry**: All buttons, inputs, and category chips utilize `{rounded.lg}` (30px) or `{rounded.md}` (24px) pills — avoiding sharp, clinical corners on interactive items.
- **Menu Card Restraint**: Product cards use `{rounded.none}` (0px radius), sit flat with no shadows, and place dish photography directly on `{colors.soft-cloud}` backdrops — the dish *is* the card.
- **Hierarchical CTA Control**: Smoked Black pills (`{component.button-primary}`) command major actions, while Warm Stone pills (`{component.button-secondary}`) handle secondary options — never cluttering the viewport with competing actions.
- **8px Grid spacing**: Major sections breathe at `{spacing.section}` (48px) intervals, with menu items aligned on a tight `{spacing.sm}` (8px) gutter.
- **Fiery Accents**: Spicy red (`{colors.sale}`) is used strictly to highlight special promos and original price markdowns.

---

## Colors

### Brand & Accent
- **Smoked Black** (`{colors.ink}` — `#15110F`): Representing grill char, rich sweet soy sauce (kecap manis), and premium slate plates. This carries all primary text, active selection states, main navigation titles, and primary CTA pill fills.
- **Clay Parchment** (`{colors.canvas}` — `#FCFAF7`): A warm, light cream off-white evoking organic paper menu cards and premium ceramic plates. It hosts the page backgrounds and inverse text on smoked black containers.

### Surface
- **Warm Stone** (`{colors.soft-cloud}` — `#F3EFE9`): The backdrop for all dish card photography, search boxes, and secondary menu cards. Provides a natural contrast that accentuates the vibrant greens, reds, and golden tones of the dishes.
- **Ember Divider** (`{colors.hairline}` — `#D2C9BF`): 1px warm sand dividers between product info rows and footer blocks.
- **Soft Sand** (`{colors.hairline-soft}` — `#EBE5DC`): A very soft inline border shadow under sticky navigation headers and bottom sheets.

### Text
- **Smoked Ink** (`{colors.ink}` — `#15110F`): Main text color for dish names, prices, titles, and major labels.
- **Burnt Charcoal** (`{colors.charcoal}` — `#3B3532`): Slightly softer contrast for dish descriptions and allergen notes.
- **Ash** (`{colors.ash}` — `#5C5551`): Low-emphasis metadata text and deactivated options.
- **Smoked Wood** (`{colors.mute}` — `#8A8077`): Subtitles (e.g. "Signature Grilled Ribs"), table numbers, and footer link titles.
- **Stone** (`{colors.stone}` — `#A89E95`): Secondary contrast text on dark overlay sheets.

### Semantic
- **Fiery Sambal** (`{colors.sale}` — `#C0392B`): Used exclusively for discounted promo prices, spicy indicators, and markdown tags.
- **Deep Chili** (`{colors.sale-deep}` — `#8E1C10`): Active states for promo tags and discount labels.
- **Fresh Basil** (`{colors.success}` — `#2E7D32`): Used for "In Stock" indicators, order success notices, and payment confirmation messages.
- **Fresh Lime** (`{colors.success-bright}` — `#4CAF50`): Active success colors on dark backgrounds.
- **Ember Glow** (`{colors.info}` — `#D35400`): Highlights member exclusives, table status (occupied), and chef specials.
- **Ember Deep** (`{colors.info-deep}` — `#A04000`): Pressed states for ember glows.

### Culinary Swatches (Spiciness & Ingredients)
- **Pedas Manis** (`{colors.accent-pink}` — `#D35400`): Sweet & Spicy glaze badge overlay.
- **Merapi Fire** (`{colors.accent-pink-deep}` — `#922B21`): Extreme chili glaze badge overlay.
- **Mild Honey** (`{colors.accent-teal}` — `#D4AC0D`): Honey-glazed ribs accent color.

---

## Typography

### Font Family
- **Bebas Neue** (display campaign only): A bold, condensed geometric sans-serif used for uppercase, high-impact titles burned onto hero photography (e.g., "IGA BAKAR MERAPI: THE RITUAL OF SMOKE").
- **Plus Jakarta Sans** (headings 16–32px): Clean geometric sans with warm open shapes, handling section titles, menu tabs, and modal headers.
- **Inter** (UI & body 12–16px): Highly legible sans-serif for descriptions, price blocks, cart item rows, and input states.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-campaign}` | 96px | 700 | 0.9 | -1% | Bold campaign headers on full-bleed hero banners (uppercase) |
| `{typography.heading-xl}` | 32px | 700 | 1.2 | 0 | Major sections — "SIGNATURE PLATTERS", "MINUMAN DINGIN" |
| `{typography.heading-lg}` | 24px | 700 | 1.2 | 0 | Dish details title, checkout summary total, large price tags |
| `{typography.heading-md}` | 16px | 600 | 1.5 | 0 | Card menu labels, cart item names, sidebar accordion titles |
| `{typography.body-md}` | 16px | 400 | 1.6 | 0 | Dish descriptions, search placeholders, ingredients summary |
| `{typography.body-strong}` | 16px | 600 | 1.5 | 0 | Primary menu titles, pricing text, active navigation elements |
| `{typography.button-lg}` | 24px | 600 | 1.2 | 0 | Interactive banner headers |
| `{typography.button-md}` | 16px | 600 | 1.5 | 0 | Standard CTA pills ("Tambah ke Keranjang", "Bayar") |
| `{typography.button-sm}` | 14px | 600 | 1.5 | 0 | Compact pills (add-ons, custom selection buttons) |
| `{typography.link-md}` | 16px | 600 | 1.5 | 0 | Underlined text links ("Detail Selengkapnya") |
| `{typography.caption-md}` | 14px | 500 | 1.5 | 0 | Product category subtitles, table indicators, footer links |
| `{typography.caption-sm}` | 12px | 600 | 1.5 | 0 | Active filters, small badges, color/spiciness indicators |
| `{typography.utility-xs}` | 9px | 500 | 1.5 | 0 | Fine print footer information |

### Principles
The typography runs on extreme scale jumps: huge 96px Bebas Neue uppercase campaign phrases directly transition into minimal 14-16px Plus Jakarta Sans / Inter interface labels. This layout avoids intermediate sizes, ensuring the focus jumps from the **sensory campaign billboard** straight to the **clean menu text**.

---

## Layout

### Spacing System
- **Base unit**: 8px
- **Tokens**: `{spacing.xxs}` (2px) · `{spacing.xs}` (4px) · `{spacing.sm}` (8px) · `{spacing.md}` (12px) · `{spacing.lg}` (18px) · `{spacing.xl}` (24px) · `{spacing.xxl}` (30px) · `{spacing.section}` (48px+)
- **Rhythm**: Sections are separated by a robust `{spacing.section}` (48px) vertical gap. Product grids are spaced with `{spacing.sm}` (8px) gutters. Modal components use `{spacing.xl}` (24px) padding.
- **Dish Cards**: 0px internal container padding. The dish photograph covers the entire card width, with the name and pricing sitting immediately below it separated by `{spacing.sm}` (8px).

### Grid & Container
- **Max width**: 1440px for content containers, centering with responsive margins on wider desktop viewports.
- **Column pattern**: The menu page uses a 4-column grid on desktop, collapsing to 3 columns on smaller desktops, 2 columns on tablets, and 1 column on mobile.
- **Cart sidebar**: 380px fixed width right drawer on desktop viewports, sliding in from the bottom/side on mobile.

---

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | Flat layout, zero shadow | Default state for all cards, buttons, lists, and sections |
| 1 — Hairline border | 1px solid `{colors.hairline}` | Separators between menu sections and cart item lists |
| 2 — Sand Shadow | `box-shadow: 0 -1px 0 {colors.hairline-soft}` | Bottom sticky bar, mobile add-to-cart panels |

No float or box-shadow elevations are applied to dish cards or buttons. Depth is created entirely by the high-contrast food photography against `{colors.soft-cloud}` flat backdrops.

---

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Dish cards, editorial blocks, headers, food photos, category bars |
| `{rounded.md}` | 24px | Search inputs, table number input pills |
| `{rounded.lg}` | 30px | All main buttons, checkout CTAs, item count selector pills |
| `{rounded.full}` | 9999px | Spiciness level dots (chili swatches), close/info icons |

### Culinary Geometry
- **Dish cards**: Square 1:1 format, with the food shot on flat warm stone (`{colors.soft-cloud}`) backdrops.
- **Hero campaign panels**: Ultra-wide 16:9 full-bleed photographic banners with Bebas Neue typography burned over the smoke textures.
- **Chili swatch dots**: 16px circular icons for selecting spiciness levels on PDPs.

---

## Components

### Buttons

**`button-primary`** — Main Call to Action
- Background `{colors.ink}` (Smoked Black), text `{colors.canvas}` (Clay Parchment), type `{typography.button-md}`, padding `16px 32px`, height 48px, rounded `{rounded.lg}`.
- Used for: "Konfirmasi Order", "Selesaikan Pembayaran", "Pesan Sekarang".

**`button-secondary`** — Low-emphasis actions
- Background `{colors.soft-cloud}` (Warm Stone), text `{colors.ink}`, type `{typography.button-md}`, padding `16px 32px`, rounded `{rounded.lg}`.
- Used for: "Kembali ke Menu", "Batal", "Tambah Ekstra Nasi".

**`button-outline-on-image`** — On-photo action pill
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.button-md}`, padding `12px 24px`, rounded `{rounded.lg}`.
- Anchored to the bottom-left of hero banners: "Lihat Detail Menu", "Pesan Promo Ini".

**`button-icon-circular`** — Icon controls
- Background `{colors.soft-cloud}`, rounded `{rounded.full}`, size 40px.
- Used for: Cart item add/remove buttons, close modal buttons, bookmarking dish buttons.

---

### Inputs & Forms

**`search-pill`**
- Default: background `{colors.soft-cloud}`, text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.md}`, height 40px.
- Focused: background `{colors.canvas}`, 2px solid border `{colors.ink}`, surrounded by a soft 12px `{colors.soft-cloud}` outline halo.

---

### Cards & Containers

**`product-card`**
- Container: background `{colors.canvas}`, rounded `{rounded.none}`, no padding, no shadows.
- Image area: Full-bleed food photography shot on `{colors.soft-cloud}` warm stone.
- Metadata (below image with `{spacing.sm}` gap):
  - Spiciness levels (represented by chili dots).
  - Promo tag if applicable ("Chef Special", "Promo Hari Ini").
  - Dish name `{typography.body-strong}` `{colors.ink}`.
  - Description summary `{typography.caption-md}` `{colors.charcoal}`.
  - Price tags `{typography.body-strong}` `{colors.ink}`.
  - If discounted: discounted price `{colors.sale}` followed by strike-through original `{colors.mute}`.
- Add CTA: `{component.button-primary}` anchored at the card base.

**`campaign-tile`**
- Full-bleed action photo with Bebas Neue typography burned over the smoke textures.
- Features a single `{component.button-outline-on-image}` pill at the bottom-left.

**`chili-swatch-dot`**
- 16px circular selectors for choosing spice levels (Level 0, Level 1, Level 2, Level 3).
- Default: filled with a warm chili tint, surrounded by `{colors.hairline}`.
- Active: filled with fiery red, surrounded by a 2px `{colors.ink}` smoked black outer ring with a 2px white gap.

**`badge-promo`**
- Background `{colors.canvas}` with a 1px border `{colors.hairline}`, text `{colors.ink}`, type `{typography.caption-sm}`, rounded `{rounded.lg}`, padding `4px 12px`.
- Display tags: "Best Seller", "Chef's Special", "Terbatas".

---

### Navigation

**`utility-bar`**
- Background `{colors.soft-cloud}`, text `{colors.ink}`, type `{typography.caption-sm}`, height 36px.
- Displays: "Lacak Order · Bantuan · Syarat & Ketentuan".

**`primary-nav`**
- Background `{colors.canvas}`, text `{colors.ink}`, height 64px.
- Displays: Brand logo, category shortcuts ("Semua Menu · Iga Bakar · Sup · Minuman · Paketan"), right-aligned cart bag icon.
- Active items use a 2px underline in `{colors.ink}`.

---

## Do's and Don'ts

### Do
- Stage all food photography on a clean `{colors.soft-cloud}` background to highlight textures and smoke details.
- Restrict `{typography.display-campaign}` (Bebas Neue) solely to major full-bleed hero banners.
- Use `{rounded.lg}` (30px) pills for all customer choice actions.
- Place promo pricing colors (`{colors.sale}`) strictly on numerical price text.

### Don't
- Never introduce drop shadows or elevated card borders. Containers must lie perfectly flat.
- Do not use bright neon colors or cold digital gradients. All brand colors must remain warm, organic, and appetite-inducing.
- Do not pad the inside of product cards; images must remain completely full-bleed.
- Never use sharp, squared edges on buttons or action CTAs.

---

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| ultrawide | 1920px+ | Content container holds at 1440px with generous margins |
| desktop | 1200px | Default 4-column menu layout, open side cart |
| tablet | 1023px | 4-column menu collapses to 2-column. Cart becomes a sliding bottom-sheet |
| mobile | 599px | Single column grids. Banners downscale display text size to 48px, maintaining the 0.9 line-height |

---

## Iteration Guide

1. Ensure component tokens (`{colors.ink}`, `{colors.canvas}`, `{rounded.lg}`) are referenced precisely without descriptive synonyms.
2. Maintain clean, high-contrast typography ratios. Reserve Bebas Neue for hero sections and Inter for all listings.
3. Validate that food photography acts as the primary layout driver; keep background decoration to zero.
4. Keep the primary CTA smoked black (`#15110F`) as the single dominant choice per viewport.
