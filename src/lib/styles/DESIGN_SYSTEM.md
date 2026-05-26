# Agentic AI Advisory — Design System

## Design Tokens

All design tokens are defined as CSS custom properties in `src/styles.css`:

- **`:root`** — light theme values
- **`:root[data-theme='dark']`** — dark theme values

See `src/lib/styles/design-tokens.ts` for a complete reference.

## Component Primitives

Located in `src/lib/components/ui/`, following the shadcn-svelte pattern:

| Component | File | Usage |
|-----------|------|-------|
| Button | `ui/button/Button.svelte` | Variants: default, primary, secondary, outline, ghost, danger, link. Sizes: sm, default, lg, icon. Renders as `<button>` or `<a>` with href. |
| Card | `ui/card/Card.svelte` | Card with Header, Title, Description, Content, Footer sub-components. |
| Input | `ui/input/Input.svelte` | Styled `<input>` extending native element attributes. |
| Label | `ui/label/Label.svelte` | Styled `<label>` companion for Input. |
| Badge | `ui/badge/Badge.svelte` | Variants: default, secondary, outline, success, warning, danger. |
| Progress | `ui/progress/Progress.svelte` | Accessible progress bar wrapping native `<progress>`. |
| Dialog | `ui/dialog/Dialog.svelte` | Modal dialog using native `<dialog>`, backdrop click to close. |
| Sheet | `ui/sheet/Sheet.svelte` | Slide-in panel from right or left with backdrop. |

## Import Convention

```svelte
<!-- Reusable primitives (barrel export) -->
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Progress } from '$lib/components/ui';

<!-- Self-contained components (dedicated export) -->
import { Dialog } from '$lib/components/ui/dialog';
import { Sheet } from '$lib/components/ui/sheet';
```

## Dark Mode

- Toggle via `.theme-toggle` button (already in header)
- Theme stored in `localStorage` as `'theme'`
- Defaults to light mode on first visit
- Applied via `data-theme` attribute on `<html>`

## Premium Moments (UX-DR6)

Premium moments are enhanced visual treatments for upsell or cross-sell elements:

- **Shadow lift**: Apply `box-shadow: var(--shadow-lift)` to premium cards
- **Gradient accent**: Use a subtle gradient border or background accent
- **Animation**: Subtle entrance animation (`translateY(-2px)` on hover)
- **Premium badge**: Use `<Badge variant="success">` or a custom star badge
- **Elevation**: Slightly higher z-index or border emphasis

## Responsive Breakpoints

- **1120px**: Grids collapse to 2 columns
- **940px**: Single column layouts, nav hidden
- **640px**: Mobile padding reduction, full-width actions

## Accessibility

- Focus outlines on all interactive elements (3px accent with 3px offset)
- aria-live regions for status updates
- Native `<dialog>` for modals (auto focus trap + escape to close)
- Native `<progress>` element for progress bars
- Color contrast meets WCAG 2.1 AA on both themes
