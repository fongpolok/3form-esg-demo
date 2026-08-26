import { describe, expect, it } from 'vitest';
import { hex } from 'wcag-contrast';
import { brand, surface, text, action, status } from './tokens';

// Every fg/bg pairing actually used across the six Figma screens (plan
// Context section), each tagged with the WCAG AA threshold that applies to
// its real usage: 4.5:1 for normal text/UI-component text, 3:1 for large
// text (>=18.66px bold or >=24px regular) or non-text UI components.
// Add a row here whenever a component introduces a new pairing — this file
// is what makes "the contrast-token test fails CI" (plan §8) a real gate
// instead of a promise.
const CONTRAST_PAIRINGS: Array<{ name: string; fg: string; bg: string; minRatio: 4.5 | 3 }> = [
  { name: 'body text on white card', fg: text.icon, bg: surface.card, minRatio: 4.5 },
  { name: 'muted helper text on page background', fg: text.muted, bg: surface.page, minRatio: 4.5 },
  { name: 'muted helper text on white card', fg: text.muted, bg: surface.card, minRatio: 4.5 },
  { name: 'sidebar text on navy950', fg: text.onDark, bg: brand.navy950, minRatio: 4.5 },
  { name: 'active nav item text on navy800', fg: text.onDark, bg: brand.navy800, minRatio: 4.5 },
  { name: 'primary button text (action.green)', fg: text.onDark, bg: action.green, minRatio: 4.5 },
  { name: 'success status pill', fg: status.success.fg, bg: status.success.bg, minRatio: 4.5 },
  { name: 'info status pill', fg: status.info.fg, bg: status.info.bg, minRatio: 4.5 },
  { name: 'warning status pill', fg: status.warning.fg, bg: status.warning.bg, minRatio: 4.5 },
  { name: 'danger status pill', fg: status.danger.fg, bg: status.danger.bg, minRatio: 4.5 },
];

describe('design token contrast (WCAG AA)', () => {
  it.each(CONTRAST_PAIRINGS)('$name meets $minRatio:1', ({ fg, bg, minRatio }) => {
    const ratio = hex(fg, bg);
    expect(ratio).toBeGreaterThanOrEqual(minRatio);
  });
});
