---
title: 'Offer section list layout'
type: 'feature'
created: '2026-05-27'
status: 'done'
route: 'one-shot'
---

# Offer section list layout

## Intent

**Problem:** The home-page offer section used a split header alignment and card grid that did not match the surrounding section header and services-list presentation patterns.

**Approach:** Switch the offer section header to the standard section-heading treatment, render offers as services-list rows, and extend the shared service-row title styling to support semantic subsection headings.

## Suggested Review Order

**Offer section structure**

- Standardizes the offer header and swaps cards for service rows.
  [`+page.svelte:351`](../../src/routes/+page.svelte#L351)

- Keeps offer row titles as subsections under the main section heading.
  [`+page.svelte:358`](../../src/routes/+page.svelte#L358)

**Shared row styling**

- Allows service-row styling to apply to semantic h3 row titles.
  [`styles.css:1338`](../../src/styles.css#L1338)
