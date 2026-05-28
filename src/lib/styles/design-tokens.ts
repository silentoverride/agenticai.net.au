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

export const DESIGN_TOKENS_VERSION = '1.1.0';

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

// ---------------------------------------------------------------------------
// Staff Portal Design Tokens — src/lib/styles/design-tokens.css
// Reference: DESIGN_SYSTEM.md
// ---------------------------------------------------------------------------

/**
 * Staff Portal semantic token categories.
 *
 * These are CSS custom properties defined in `src/lib/styles/design-tokens.css`
 * under `:root` (light) and `[data-theme="dark"]` (dark). This object mirrors
 * those tokens for IDE autocomplete in TypeScript contexts. Tokens are never
 * imported at runtime for styling — CSS custom properties handle all theming.
 *
 * Naming convention: `--ai-{category}-{property}` or `--{semanticAxis}-{state}-{property}`
 */
export const STAFF_PORTAL_TOKENS = {
  /** Status axis — workflow state colours (neutral, attention, warning, danger, success, audit, disabled) */
  status: {
    text: ['--status-neutral-text', '--status-attention-text', '--status-warning-text', '--status-danger-text', '--status-success-text', '--status-audit-text', '--status-disabled-text'],
    bg: ['--status-neutral-bg', '--status-attention-bg', '--status-warning-bg', '--status-danger-bg', '--status-success-bg', '--status-audit-bg', '--status-disabled-bg'],
    border: ['--status-neutral-border', '--status-attention-border', '--status-warning-border', '--status-danger-border', '--status-success-border', '--status-audit-border', '--status-disabled-border'],
    icon: ['--status-neutral-icon', '--status-attention-icon', '--status-warning-icon', '--status-danger-icon', '--status-success-icon', '--status-audit-icon', '--status-disabled-icon'],
  },
  /** Risk axis — severity colours (none, low, medium, high, blocked) */
  risk: {
    text: ['--risk-none-text', '--risk-low-text', '--risk-medium-text', '--risk-high-text', '--risk-blocked-text'],
    bg: ['--risk-none-bg', '--risk-low-bg', '--risk-medium-bg', '--risk-high-bg', '--risk-blocked-bg'],
    border: ['--risk-none-border', '--risk-low-border', '--risk-medium-border', '--risk-high-border', '--risk-blocked-border'],
  },
  /** Readiness axis — operational readiness (available, pending, unavailable, stale) */
  readiness: {
    text: ['--readiness-available-text', '--readiness-pending-text', '--readiness-unavailable-text', '--readiness-stale-text'],
    bg: ['--readiness-available-bg', '--readiness-pending-bg', '--readiness-unavailable-bg', '--readiness-stale-bg'],
    border: ['--readiness-available-border', '--readiness-pending-border', '--readiness-unavailable-border', '--readiness-stale-border'],
  },
  /** Action intent axis — decision button colours (approve, reject, neutral, escalate, claim, override, danger) */
  actionIntent: {
    text: ['--action-approve-text', '--action-reject-text', '--action-neutral-text', '--action-escalate-text', '--action-claim-text', '--action-override-text', '--action-danger-text'],
    bg: ['--action-approve-bg', '--action-reject-bg', '--action-neutral-bg', '--action-escalate-bg', '--action-claim-bg', '--action-override-bg', '--action-danger-bg'],
    border: ['--action-approve-border', '--action-reject-border', '--action-neutral-border', '--action-escalate-border', '--action-claim-border', '--action-override-border', '--action-danger-border'],
    hoverBg: ['--action-approve-hover-bg', '--action-reject-hover-bg', '--action-neutral-hover-bg', '--action-escalate-hover-bg', '--action-claim-hover-bg', '--action-override-hover-bg', '--action-danger-hover-bg'],
  },
  /** Typography scale */
  typography: {
    fontSize: ['--ai-font-size-page-title', '--ai-font-size-section-title', '--ai-font-size-body', '--ai-font-size-small-meta'],
    fontWeight: ['--ai-font-weight-page-title', '--ai-font-weight-section-title', '--ai-font-weight-body', '--ai-font-weight-small-meta'],
    lineHeight: ['--ai-line-height-page-title', '--ai-line-height-section-title', '--ai-line-height-body', '--ai-line-height-small-meta'],
  },
  /** Spacing scale */
  spacing: ['--ai-space-xs', '--ai-space-sm', '--ai-space-md', '--ai-space-lg', '--ai-space-xl', '--ai-space-2xl', '--ai-space-3xl'],
  /** Portal shell tokens */
  portal: ['--portal-surface-bg', '--portal-surface-border', '--portal-radius-sm', '--portal-radius-md', '--portal-radius-lg', '--portal-shadow-sm', '--portal-shadow-md', '--portal-font-mono', '--portal-font-sans', '--portal-focus-ring'],
} as const;
