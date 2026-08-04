# Design Map

## Spacing Scale

- Base: 8px
- Observed: 8px, 16px, 24px, 40px, 48px, 80px, 96px

## Font Hierarchy

- Hero: degularFont, 72px, 700, 72px line height
- Section: degularFont, 48px, 700
- Body: Inter, 20px, 400, 28px line height
- Action: Inter, 12px, 600, 16px line height

## Color Palette

- Dark field: #011369
- Surface: #FFFFFF
- Ink: #000000
- Supporting text: #4B5563
- Control text: #374151

## Image Ratios

- Product preview: ~16:9
- Feature panel: ~4:3

## Component Tokens

- Radius: 6px, 8px, 12px, 16px, 24px, 9999px
- Shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)
- Grid: ~1280px, 12 columns, 24px gutter

---

# Taste DNA

### Display-led decision points

- **Trigger**: When a visitor needs to understand the product proposition.
- **Decision**: Uses a 72px/700 display headline over keeping all text in the body face.
- **Reason**: The decision is visible before the visitor enters the long product narrative.
- **Evidence**: h1 uses degularFont at 72px/700; body copy uses Inter at 20px/400.

### Blue fields, neutral reading surfaces

- **Trigger**: When separating high-stakes product moments from supporting material.
- **Decision**: Uses #011369 as a full field while retaining #FFFFFF content surfaces instead of tinting every section blue.
- **Reason**: The blue field creates a page-scale change in attention without reducing reading contrast across the whole page.
- **Evidence**: Observed section backgrounds include rgb(1, 19, 105) and rgb(255, 255, 255); supporting text is rgb(75, 85, 99).

### Rounded action vocabulary

- **Trigger**: When a control must look immediately actionable.
- **Decision**: Uses 12–24px component rounding and 9999px on compact action links over square controls.
- **Reason**: The shape distinguishes things that can be acted on from editorial content without a heavy border system.
- **Evidence**: Observed radii include 12px ×33, 16px ×13, 24px ×8, and 9999px ×4.

### Whitespace over enclosing every statement

- **Trigger**: When a long landing page must hold many product categories.
- **Decision**: Uses 40px, 48px, 80px, and 96px section padding instead of turning every block into a bordered card.
- **Reason**: The long scroll stays legible because each new concept gets a visible reset point.
- **Evidence**: Observed section padding: 40px, 48px, 80px, 96px; primary content sections use transparent backgrounds.
