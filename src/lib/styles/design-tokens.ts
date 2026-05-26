/**
 * Design Token Reference
 *
 * This file is a reference only — it documents the CSS custom properties
 * (design tokens) used throughout the application. The actual token values
 * are defined in `src/styles.css` under `:root` and `:root[data-theme='dark']`.
 *
 * ## Token Categories
 *
 * ### Color
 * | Token | Light | Dark | Purpose |
 * |-------|-------|------|---------|
 * | --color-ink | #0f172a | #f8fafc | Primary text |
 * | --color-ink-2 | #1e293b | #e2e8f0 | Secondary text |
 * | --color-muted | #64748b | #cbd5e1 | Muted text |
 * | --color-muted-2 | #94a3b8 | #94a3b8 | Very muted text |
 * | --color-page | #f8fafc | #0b1120 | Page background |
 * | --color-panel | #ffffff | #111827 | Card/panel background |
 * | --color-panel-soft | #f1f5f9 | #1e293b | Soft panel background |
 * | --color-line | #e2e8f0 | rgba(255,255,255,0.12) | Borders |
 * | --color-line-soft | #f1f5f9 | rgba(255,255,255,0.08) | Soft borders |
 * | --color-primary | #0f172a | #f8fafc | Primary |
 * | --color-primary-2 | #1e293b | #e2e8f0 | Primary variant |
 * | --color-accent | #2563eb | #60a5fa | Accent / links / CTAs |
 * | --color-accent-2 | #1d4ed8 | #60a5fa | Accent hover |
 * | --color-accent-light | #eff6ff | rgba(37,99,235,0.18) | Accent light bg |
 * | --color-accent-mid | #bfdbfe | rgba(96,165,250,0.48) | Accent mid border |
 * | --color-warm | #d97706 | #d97706 | Warm accent |
 * | --color-success | #059669 | #059669 | Success |
 * | --color-header | rgba(255,255,255,0.88) | rgba(11,17,32,0.88) | Sticky header |
 *
 * ### Spacing
 * | Token | Value |
 * |-------|-------|
 * | --pad-h | clamp(1.5rem, 5vw, 4rem) | Horizontal page padding |
 * | --max-w | 1320px | Max content width |
 *
 * ### Border Radius
 * | Token | Value |
 * |-------|-------|
 * | --radius | 10px | Default radius |
 * | --radius-sm | 7px | Small radius |
 *
 * ### Shadows
 * | Token | Value |
 * |-------|-------|
 * | --shadow-sm | Small shadow (cards, elements) |
 * | --shadow-panel | Panel shadow (modals, dropdowns) |
 * | --shadow-lift | Lift shadow (hero cards, hero visuals) |
 *
 * ### Typography
 * - Font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont
 * - h1: clamp(2.5rem, 4.5vw, 4rem), 900 weight
 * - h2: clamp(1.8rem, 3vw, 2.8rem), 900 weight
 * - h3: 0.95rem, 800 weight
 * - Body: 1rem, default weight
 * - Small: 0.88rem (card-description)
 * - Caption: 0.72–0.82rem (badge, eyebrow, tags)
 *
 * ## Theme toggle
 * The theme is controlled by `data-theme` attribute on `<html>`:
 * - `data-theme="light"` (default)
 * - `data-theme="dark"`
 *
 * Set via:
 * 1. localStorage 'theme' key (user preference)
 * 2. Default to 'light'
 *
 * ## Premium Moments (UX-DR6)
 * Premium moments use enhanced styling for upsell/cross-sell elements:
 * - Box-shadow: var(--shadow-lift)
 * - Gradient accent borders
 * - Subtle entrance animations
 * - Badge indicator (premium tag variant)
 * - Slightly elevated z-index
 */

export const DESIGN_TOKENS_VERSION = '1.0.0';

/** List all CSS custom property token names for IDE autocomplete reference. */
export const TOKEN_NAMES = [
  '--color-ink', '--color-ink-2', '--color-muted', '--color-muted-2',
  '--color-page', '--color-panel', '--color-panel-soft',
  '--color-line', '--color-line-soft',
  '--color-primary', '--color-primary-2',
  '--color-accent', '--color-accent-2', '--color-accent-light', '--color-accent-mid',
  '--color-warm', '--color-success', '--color-header',
  '--radius', '--radius-sm', '--max-w', '--pad-h',
  '--shadow-sm', '--shadow-panel', '--shadow-lift'
] as const;
