# Design System: TemplateForge

## 1. Visual Theme & Atmosphere

TemplateForge feels like a dark developer workbench for shipping email infrastructure: precise, calm, asymmetric, and concrete. Density is balanced for daily work, variance is high enough to avoid generic SaaS symmetry, and motion is CSS-only with restrained cascade and breathing states.

## 2. Color Palette & Roles

- **Charcoal Canvas** (#09090B) - Primary app background.
- **Workbench Surface** (#111113) - Panels, forms, editor shells, and preview surfaces.
- **Raised Surface** (#18181B) - Secondary panels and selected states.
- **Zinc Ink** (#F4F4F5) - Primary text.
- **Muted Graphite** (#A1A1AA) - Secondary labels, helper text, and metadata.
- **Hairline Zinc** (rgba(244,244,245,0.11)) - Borders and structural dividers.
- **Citron Dispatch** (#A7C957) - The only accent, used for primary actions and readiness indicators.
- **Clay Error** (#D65F4A) - Errors and warnings only.

## 3. Typography Rules

- **Display:** Geist Sans, tight tracking, controlled scale, sans-serif only.
- **Body:** Geist Sans, relaxed leading, max 65 characters where reading matters.
- **Mono:** Geist Mono for variables, env names, version numbers, statuses, and API identifiers.
- **Banned:** Inter, generic serif fonts, neon gradients, oversized screaming headers.

## 4. Component Stylings

- **Buttons:** Rounded-full, tactile active translate, no outer glow.
- **Cards:** Used only for editors, preview shells, and key workflow regions. Radius is large but practical, with subtle diffusion shadows.
- **Inputs:** Label above, helper below, rounded controls, citron focus ring.
- **Code Blocks:** Dark zinc panels with soft white inner borders and compact monospace text.
- **Empty States:** Composed workspace states that explain how to generate the first template.
- **Errors:** Inline clay-tinted notices with actionable text.

## 5. Layout Principles

Use CSS Grid first. Desktop layouts are asymmetric with split work surfaces; mobile collapses to a strict single column. Page width is capped at 1400px. Avoid three-equal-card feature rows. No overlapping content or horizontal scroll.

## 6. Motion & Interaction

Use hardware-accelerated `transform` and `opacity` only. Lists cascade in with staggered delays. Active readiness dots breathe gently. Avoid continuous React state animation and avoid third-party animation libraries unless explicitly added.

## 7. Anti-Patterns

No emojis, no pure black, no purple or blue neon, no decorative orbs, no gradient text headers, no custom cursors, no generic startup names, no fake perfect numbers, no filler copy, and no unconfigured third-party icon imports.
