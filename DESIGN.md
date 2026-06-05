---
name: Agentic AI
description: AI Business Assessment platform — practical intelligence for Australian SMBs
colors:
  deep-slate-ink: "#0f172a"
  slate-800: "#1e293b"
  muted-slate: "#64748b"
  mist-slate: "#94a3b8"
  warm-page: "#f8fafc"
  white: "#ffffff"
  soft-stone: "#f1f5f9"
  stone-line: "#e2e8f0"
  steel-blue: "#2563eb"
  steel-blue-deep: "#1d4ed8"
  steel-blue-wash: "#eff6ff"
  steel-blue-mid: "#bfdbfe"
  amber: "#d97706"
  emerald: "#059669"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2.5rem, 4.5vw, 4rem)"
    fontWeight: 900
    lineHeight: 1.05
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.85rem, 3.2vw, 3rem)"
    fontWeight: 900
    lineHeight: 1.05
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 800
    lineHeight: 1.3
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.68
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 800
    letterSpacing: "0.1em"
rounded:
  sm: "7px"
  md: "10px"
spacing:
  page-h: "clamp(1.5rem, 5vw, 4rem)"
  max-w: "1320px"
components:
  button-primary:
    backgroundColor: "{colors.steel-blue}"
    textColor: "#ffffff"
    rounded: "999px"
    padding: "0.7rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.steel-blue-deep}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.deep-slate-ink}"
    rounded: "999px"
    padding: "0.7rem 1.5rem"
  button-secondary-hover:
    backgroundColor: "{colors.soft-stone}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted-slate}"
    rounded: "999px"
    padding: "0.7rem 1.5rem"
  button-ghost-hover:
    backgroundColor: "{colors.soft-stone}"
    textColor: "{colors.deep-slate-ink}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.deep-slate-ink}"
    rounded: "999px"
    padding: "0.7rem 1.5rem"
---

# Design System: Agentic AI

## 1. Overview

**Creative North Star: "The Operations Brief"**

Agentic AI's visual system is designed to feel like an executive briefing document — structured, recommendation-driven, evidence-based — rather than a technology product. Every screen should answer "What's happening in my business and what should I do next?" within 30 seconds of scanning. The dominant metaphor (70%) is the operations brief: clear hierarchy, scannable structure, specific over generic. The secondary influence (30%) is the modern Australian practice: human, approachable, direct, with none of the corporate theatre or consulting-firm stiffness of traditional professional services firms.

The system explicitly rejects Silicon Valley hype (no neon gradients, sci-fi robots, floating AI brains, "the future is here" energy), enterprise consultancy bloat (no corporate jargon walls, no generic stock photography, no emotionally empty polish), SaaS product marketing (no dashboard screenshots as hero, no feature comparison tables, no "sign up now" urgency), and generic AI agency templates (no purple gradients, no robot imagery, no floating network nodes, no GPT-wrapper clichés).

**Key Characteristics:**
- Information-first: typography and spacing do the heavy lifting; decoration exists only to support comprehension
- Restrained color: the accent appears on ≤10% of any screen surface; white space and warm neutrals carry the page
- Pill-shaped rhythm: full-radius buttons, badges, and toggles create a consistent, approachable silhouette
- Flat at rest: shadows are ambient and barely visible; they lift only as state signals (hover, focus, modal overlay)
- Professional brevity: headings are tight, body text is generous but concise, every line earns its place

## 2. Colors

The palette is built on three tonal families: slate for authority and intelligence, steel blue for trust and technology, and warm neutrals for the human, approachable layer that softens the professional rigor.

### Primary
- **Deep Slate Ink** (#0f172a): All headings and primary body text. The system's anchor — sharper than pure black, more modern than dark grey. Communicates intelligence, stability, and authority without severity.
- **Slate 800** (#1e293b): Secondary text, supporting headings, hover states on dark backgrounds.

### Neutral
- **Warm Page** (#f8fafc): Full-page background. A barely-there off-white with the faintest blue undertone — warmer and more human than pure white, cooler than cream.
- **White** (#ffffff): Card and panel surfaces. Clean separation from the page background without hard contrast.
- **Soft Stone** (#f1f5f9): Soft panel backgrounds, hover states, disabled surfaces. The mid-tone between white and page.
- **Stone Line** (#e2e8f0): Borders, dividers, input strokes. Visible enough to define shape, quiet enough to recede.
- **Muted Slate** (#64748b): Secondary body text, captions, muted navigation labels. Readable but subordinate.
- **Mist Slate** (#94a3b8): Tertiary text — placeholders, timestamps, very quiet metadata. The lightest text that remains accessible.

### Accent
- **Steel Blue** (#2563eb): Primary accent. Links, CTA buttons, focus rings, interactive indicators. Trust without startup energy, technology without futurism. Used sparingly.
- **Steel Blue Deep** (#1d4ed8): Hover states on accent elements. Darker by one step — enough to register, not enough to shout.
- **Steel Blue Wash** (#eff6ff): Badge backgrounds, selected-item backgrounds, very light accent surfaces.
- **Steel Blue Mid** (#bfdbfe): Mid-tone accent — hover borders, selected borders, subtle accent indicators.

### Signal
- **Amber** (#d97706): Warnings, attention states, warm highlights. Richer than yellow, less sales-driven than orange.
- **Emerald** (#059669): Success states, completion indicators, positive confirmation.

### Named Rules
**The One Voice Rule.** The steel blue accent must occupy no more than 10% of any given screen's surface area. Its impact comes from scarcity. If you feel the need for a second accent color, the layout needs more white space, not more color.

**The No Gradient Rule.** Gradients are prohibited. No background gradients, no text gradients, no border gradients, no overlay gradients. Solid colors only. Gradients are the visual equivalent of startup hype — they signal "technology product" when the system must signal "business intelligence."

**The Purple Prohibition.** Purple in any form (violet, lavender, mauve, amethyst) is forbidden. It is the universal signal of the generic AI agency template and directly undermines the system's differentiation.

## 3. Typography

**Font:** Inter (with system-ui fallback chain: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif).

**Character:** Inter's clean, neutral geometry supports the briefing-document metaphor perfectly — it is highly readable at small sizes, authoritative at display sizes, and carries no decorative baggage. The weight scale is used aggressively: 900-weight display headings create clear visual anchors; 400-weight body text keeps long-form content comfortable.

### Hierarchy
- **Display** (900, clamp(2.5rem, 4.5vw, 4rem), 1.05): Hero headlines. One per page. Use only when the page has a single dominating message. Never stack two display headings adjacent.
- **Headline** (900, clamp(1.85rem, 3.2vw, 3rem), 1.05): Section anchors below hero. Use to introduce major content shifts. The tight line-height (1.05) creates a solid, blocky presence.
- **Title** (800, 0.95rem, 1.3): Card titles, section sub-heads, form labels when they introduce a block. Small but heavy — the weight carries the authority.
- **Body** (400, 1rem, 1.68): All running text. The wide line-height (1.68) prioritizes readability over density — this is a briefing document, not a terms-of-service wall. Max line length should not exceed 75ch.
- **Label / Eyebrow** (800, 0.72rem, 0.1em letter-spacing, uppercase): Section markers, card meta-labels, badge text. Always uppercase, always tight tracking. Never used for sentences — maximum three words.

### Named Rules
**The Weight Cliff Rule.** The jump from 400 (body) to 800 (title) to 900 (headline/display) is deliberate. Never introduce intermediate weights (500, 600, 700) — they blur the hierarchy and make the page feel indecisive. Use 400 or go bold.

**The No Italic Rule.** Italics are prohibited. The system communicates emphasis through weight, size, and color — not oblique angle. Inter italics feel decorative; the briefing-document metaphor requires structural emphasis, not typographic flair.

## 4. Elevation

The system is flat by default. Shadows exist but should be barely perceptible at rest — they serve as ambient depth cues, not dramatic visual effects. Cards feel grounded like paper on a desk, not floating like SaaS dashboard widgets. The dark-mode shadow values are darker and slightly stronger, compensating for the reduced contrast range.

### Shadow Vocabulary
- **ambient-sm** (`0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)`): Inputs, small cards, buttons at rest. Nearly invisible; you should only notice it's missing, not that it's there.
- **ambient-panel** (`0 4px 16px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.05)`): The default card shadow. Subtle separation from the page background. Appears on hover for cards that are interactive.
- **ambient-lift** (`0 16px 48px rgba(15,23,42,0.22), 0 4px 14px rgba(15,23,42,0.14)`): Modal dialogs, key CTA moments, important report highlights. Used rarely — no more than once per screen. If multiple elements need lift, the layout needs rethinking.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only in response to state (hover, focus, modal overlay). A card that casts a shadow without being interacted with is wasting visual attention.

## 5. Components

### Buttons
- **Shape:** Full-radius pill (999px border-radius). The soft silhouette is the system's friendliest gesture — approachable, modern, distinctly non-corporate.
- **Primary:** Solid steel blue background, white text. Font-weight 800, 0.95rem, min-height 3rem. On hover: darkens to steel blue deep, lifts 1px, 150ms ease. Focus-visible: 3px steel blue outline at 30% opacity, 3px offset.
- **Secondary:** White background, 1px stone line border, deep slate ink text. Same metrics as primary. On hover: border shifts to steel blue mid, lifts 1px.
- **Outline:** Transparent background, 1px stone line border. Reserved for lower-priority actions alongside a primary. On hover: soft stone background, border shifts to steel blue mid. No lift.
- **Ghost:** Transparent background, no border, muted slate text. For tertiary actions, icon-only buttons, navigation items. On hover: soft stone background, text darkens to deep slate ink.
- **Danger:** Solid #dc2626 red. Only for destructive actions. On hover: darkens to #b91c1c, lifts 1px.
- **Link:** Transparent, steel blue text, underline with 2px offset. Font-weight 700 (slightly lighter than other buttons). On hover: color darkens to steel blue deep.
- **Sizes:** sm (0.8125rem, min-height 2.2rem), default (0.95rem, min-height 3rem), lg (1.05rem, min-height 3.5rem), icon (2.8rem square).

### Badges / Chips
- **Shape:** Full-radius pill (999px), inline-flex, 0.72rem font-size, 800 weight, tight padding (0.28rem × 0.65rem).
- **Default:** Steel blue wash background, steel blue mid border, steel blue text. For category tags, feature labels.
- **Secondary:** Soft stone background, stone line border, muted slate text. For metadata tags.
- **Outline:** Transparent, stone line border, deep slate ink text. For filter chips.
- **Success:** #ecfdf5 background, #6ee7b7 border, emerald text.
- **Warning:** #fffbeb background, #fcd34d border, amber text.
- **Danger:** #fef2f2 background, #fca5a5 border, #dc2626 text.

### Cards
- **Corner Style:** 10px radius (var(--radius)).
- **Background:** White panel.
- **Border:** 1.5px stone line at rest. On hover (if interactive): border shifts to steel blue mid, shadow eases to ambient-panel. Transition: 150ms ease.
- **Internal padding:** None applied by the Card wrapper — padding is set by Card.Content. This allows edge-to-edge images and headers.
- **Shadow strategy:** No shadow at rest. Shadow appears on hover for interactive cards. Non-interactive cards remain flat.

### Inputs
- **Style:** White background, 1px stone line border, 10px radius, 0.95rem font-size, 2.8rem height, horizontal padding 1rem. Full width by default.
- **Placeholder:** Mist slate color (#94a3b8).
- **Focus:** Border shifts to steel blue, 3px steel blue outline at 15% opacity, 2px offset. Transition: 150ms ease.
- **Disabled:** 50% opacity, cursor not-allowed.

### Navigation
- **Site header:** Sticky top, white panel background, bottom border 1px stone line, z-index 50. Flexbox row: brand logo (2rem height) | nav links | action buttons.
- **Nav links:** 0.875rem, 500 weight, muted slate color. On hover: color shifts to deep slate ink. 150ms transition. 1.5rem gap between links.
- **CTA button (header):** Solid steel blue pill, 0.8rem, 700 weight, compact padding (0.45rem × 1rem). On hover: darkens to steel blue deep.
- **Secondary header buttons:** Transparent background, 1px stone line border, pill shape, 0.8rem, 600 weight, muted slate text. On hover: soft stone background, text darkens.
- **Theme toggle:** 2rem circular button, stone line border, muted slate icon. On hover: soft stone background, darkens. Contains sun/moon SVG inline icons.
- **Staff badge:** Steel blue wash background, full-radius pill, uppercase 0.75rem, 700 weight, steel blue text.

### Section Layouts
- **Eyebrow + Heading pattern:** Every section opens with a small uppercase eyebrow (label style: 0.72rem, 800 weight, 0.1em tracking, muted slate or steel blue color) followed by a headline (h2: 900 weight, clamp(1.85rem, 3.2vw, 3rem), 1.05 line-height). An optional description paragraph follows in body style, muted slate color, max-width 60ch. This three-line rhythm — eyebrow, heading, body — is the page's structural heartbeat. Never omit the eyebrow; it provides the scannable anchor.
- **Content max-width:** 1320px, centered, with horizontal page padding (clamp(1.5rem, 5vw, 4rem)).
- **Section spacing:** Generous vertical whitespace between sections — never crowd two sections without clear breathing room.

### Hero Assessment Preview
- **Purpose:** The signature visual pattern on the landing page. A preview of the assessment report output rendered as if it were a briefing document excerpt — not a screenshot or dashboard mockup.
- **Opportunity Map card:** White panel, 10px radius, 1.5px stone line border, ambient-lift shadow (the one exception to flat-by-default — the hero visual earns the lift). Internal header with eyebrow and title, 48-hour status pill in the corner.
- **Signal Card:** A highlighted metric inset within the map grid. Soft stone background, muted slate label (0.78rem), display-weight value (1.6rem, 900 weight, deep slate ink), and a small muted caption.
- **Workflow Lanes:** Horizontal bars showing opportunity severity. Lane label (0.82rem, 700 weight, deep slate ink) with a muted tag on the right. Track bar: stone line background, full-radius, 0.5rem height. Fill indicator: steel blue, width set by severity percentage (66–86%).
- **Roadmap Preview:** Ranked quick-win items. Each item: numbered (01, 02, 03) in 800-weight deep slate ink, a description line (0.9rem, deep slate ink), and an impact label (0.82rem, 700 weight, emerald for time-saved, steel blue for rate improvements). Separated by 1px stone-line-soft dividers.
- **Assessment Lens note:** A callout box at the bottom. Steel blue left border accent (3px), soft stone background, AI badge pill (small steel-blue-wash pill), and a headline: 'Inspect the work first, then choose the simplest useful AI system.' This is the philosophical close of the hero visual.

### Assessment Cards (Service Grid)
- **Structure:** A grid of 3 columns (collapses to 2, then 1). Each card: white panel, 10px radius, 1.5px stone line border, no shadow at rest. Internal padding: 1.5rem.
- **Icon container:** Centered circle (3.5rem), steel blue wash background, containing an inline SVG icon (steel blue, 1.5rem). Never use icon fonts or external icon libraries — SVG inline only.
- **Title:** 0.95rem, 800 weight, centered, deep slate ink.
- **Description:** 0.9rem, 400 weight, muted slate, centered, 1.6 line-height.
- **Hover (interactive cards only):** Border shifts to steel blue mid, ambient-panel shadow appears. Non-interactive cards (static content) remain flat.

### Metric Strip
- **Purpose:** A horizontal row of key numbers displayed under the hero CTA. Builds credibility through specificity.
- **Layout:** Flexbox row, wrapped on narrow screens. Gap: 2rem.
- **Value:** 1.1rem, 800 weight, deep slate ink.
- **Label:** 0.78rem, muted slate, directly below the value.
- **Max 4 metrics per strip.** More than 4 dilutes impact.

### Testimonial Cards
- **Structure:** White panel, 10px radius, 1.5px stone line border, 1.5rem internal padding. Grid of 3 columns (collapses to 1). No shadow at rest.
- **Star rating:** Row of filled star SVGs, amber (#f59e0b), 16px. Stars always appear before the quote.
- **Quote:** 0.92rem, 400 weight, slate-800 color, 1.6 line-height. Wrapped in actual quotation marks via CSS or markup — never decorative quote icons.
- **Author:** Separated by a 1px stone-line-soft top border, 0.85rem padding-top. Name: 0.88rem, deep slate ink, 600 weight. Role: 0.78rem, muted slate, below name.

### FAQ Accordion
- **Structure:** A single-column stack of `<details>` elements. Max-width 720px. Each item separated by a 1px stone line bottom border; first item also has a top border.
- **Question (summary):** 0.95rem, 700 weight, deep slate ink. Flexbox row with text on left and a chevron SVG (16px, muted-slate-2) on right. Padding: 1.15rem vertical. On hover: text color shifts to steel blue. Chevron rotates 180° when open (200ms ease).
- **Answer:** Padded below the question (1.15rem bottom). Body text: 0.9rem, muted slate, 1.65 line-height, max-width 60ch. Never use monospace or technical formatting in answers — plain language only.

### Disclaimer Banner
- **Purpose:** Informational callout used in the orientation panel and any context requiring legal/scope disclosure.
- **Style:** Soft stone background, 7px radius (var(--radius-sm)), 1px stone line border. Flexbox row: warning/info SVG icon (steel blue, 18px, flex-shrink) on the left, text block on the right. Internal padding: 0.9rem 1rem.
- **Title:** 0.85rem, 700 weight, deep slate ink.
- **Body:** 0.82rem, muted slate, 1.55 line-height.
- **Privacy link (optional):** 0.82rem, 700 weight, steel blue, underline with 2px offset. On hover: darkens to steel blue deep.

### Dialog (Modal)
- **Overlay:** 50% black backdrop behind the dialog panel. Native `<dialog>` element with `::backdrop` for accessibility.
- **Panel:** White background, 10px radius, max-width 500px, max-height 85vh, 90vw width. No border — the backdrop provides separation. Internal padding managed by content sections.
- **Header:** Flexbox row: icon + title block + close button (top-right). Close button: 2rem circle, transparent, muted-slate-2 icon, hover reveals soft stone background.
- **Body:** Scrollable content area with 1rem vertical gap between sections.
- **Footer:** Top border 1px stone line, flexbox row with actions right-aligned. Primary action: steel blue pill button. Secondary: transparent underlined text link.

### Sheet (Slide-out Panel)
- **Overlay:** 50% black backdrop, fades in 200ms.
- **Panel:** Slides in from right (or left). White background, max-width 400px, 85vw width, full height. Grid rows: header | scrollable body | footer. Z-index 61 (above site header). Transform animation: 200ms ease.
- **Header/Footer:** Same pattern as Dialog — header with close, footer with action buttons.
- **Use for:** Detail panels, filter drawers, mobile navigation. Never for primary content.

### Progress Bar
- **Track:** Stone line background, full-radius (999px), 0.5rem height, full width.
- **Fill:** Steel blue gradient (steel-blue-deep to steel-blue), full-radius, width transition 300ms ease. The gradient is the one exception to the No Gradient Rule — it's a progress indicator, not a decorative surface. Width set via percentage.
- **Accessibility:** Native `<progress>` element hidden visually (0 dimensions, transparent), with a styled visual track layered on top. Screen readers read the native element.

### CTA Section
- **Purpose:** The bottom-of-page conversion section. Full-width, warm-page background, generous vertical padding.
- **Heading:** h2 display style, centered.
- **Subtext:** Body style, muted slate, centered, max-width 50ch.
- **Button:** Primary steel blue pill, centered below subtext.
- **Trust note:** Small text below button: 0.78rem, muted-slate-2, centered. Privacy link in steel blue, 700 weight, underlined. This micro-copy is essential — it closes the trust loop before the conversion ask.

### Tag Grid
- **Purpose:** A dense cluster of use-case or capability tags used in split-section layouts.
- **Style:** Individual tags: steel blue wash background, steel blue mid border, steel blue text, pill shape (999px), 0.78rem, 600 weight, padding 0.35rem 0.85rem. Not interactive.
- **Layout:** Flexbox wrap, 0.5rem gap. Tags flow naturally; no forced grid.
- **Maximum 12 tags.** Beyond 12, the grid becomes visual noise.

## 6. Do's and Don'ts

### Do:
- **Do** lead every section with a clear, specific headline. Visitors should understand the page structure by scanning headings alone.
- **Do** use generous white space between sections. The briefing-document metaphor needs breathing room; dense layouts feel like walls of text.
- **Do** keep the steel blue accent to ≤10% of screen surface. Its impact comes from scarcity.
- **Do** pair color with icons, labels, shapes, or text — never let color alone carry meaning.
- **Do** use pill-radius (999px) silhouettes for all interactive elements. The consistent shape language builds a recognizable, approachable brand.
- **Do** keep body text at 1rem minimum with 1.68 line-height. This is a business briefing, not a terms-of-service footnote.
- **Do** respect `prefers-reduced-motion`: disable hover lifts, parallax, and any non-essential animation.
- **Do** use weight (400 → 800 → 900) to establish hierarchy — never introduce intermediate font weights.

### Don't:
- **Don't** use gradients of any kind. No background gradients, text gradients, border gradients, or overlay gradients. They signal "tech startup" when the system must signal "business intelligence."
- **Don't** use purple, violet, lavender, or mauve. These are the universal signal of the generic AI agency template and directly undermine differentiation.
- **Don't** use teal or cyan as accent colors. They read as SaaS product marketing.
- **Don't** use orange as a dominant color. It feels sales-driven.
- **Don't** use green as a primary or secondary role. Green communicates ESG, sustainability, or finance — not AI business assessment.
- **Don't** use floating card effects, aggressive shadows, or multiple depth layers. The system is flat at rest; lift is reserved for state signals.
- **Don't** use italic text. Structural emphasis (weight, size, color) communicates authority; oblique angle communicates decoration.
- **Don't** use robot imagery, AI brain illustrations, floating network nodes, or sci-fi motifs. These are generic AI agency clichés that erode trust with the Australian SMB audience.
- **Don't** use stock photography of people in boardrooms, handshake photos, or generic "business meeting" imagery. These read as enterprise consultancy bloat.
- **Don't** use dashboard screenshots as hero imagery. The site sells assessment and strategy, not software.
