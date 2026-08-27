// Design tokens sourced directly from the Figma file (fetched via the Figma
// REST API — see the implementation plan's Context section). Two groups of
// colors that were NOT usable as-delivered are called out below; every other
// value here is the literal Figma hex.
//
// tokens.contrast.test.ts turns every pairing actually used in the six Figma
// screens into an automated WCAG AA gate. Do not add a new fg/bg pairing to
// a component without also adding it to CONTRAST_PAIRINGS in that test —
// an uncovered pairing is exactly how the two issues below shipped in the
// first place (the Figma file itself is not WCAG-checked).

export const brand = {
  navy950: '#0a1628', // sidebar / topbar background
  navy800: '#10233d', // active nav item, accent panel fill
  navy700: '#1b355a', // avatar chip background
} as const;

export const surface = {
  card: '#ffffff',
  page: '#f4f6f9',
  input: '#f8fafc',
} as const;

export const border = {
  placeholder: '#d1d6e0',
} as const;

export const text = {
  onDark: '#ffffff',
  icon: '#1e293b',
  // ISSUE 1 (fixed here): the Figma value #64748b is 4.40:1 against
  // surface.page (#f4f6f9) — just under the 4.5:1 AA text minimum for the
  // "vs last quarter" / helper-text role it's used in on that background.
  // Darkened by the minimum amount that clears 4.5:1 on both surfaces this
  // token appears on (surface.page and surface.card); visually
  // indistinguishable from the original at a glance.
  muted: '#627288', // was #64748b in the Figma file

  // ISSUE 3 (found by the automated axe-core pass, not the original Figma
  // audit): inactive sidebar nav-link text used the same #64748b directly
  // on the navy sidebar (bg.navy950/800) — 3.81:1 there, since a muted
  // gray tuned for light surfaces isn't automatically safe on a dark one.
  // This is that color's dark-background counterpart, lightened until
  // it clears 4.5:1 against navy950.
  mutedOnDark: '#748297',
} as const;

// Decorative use only: chart bars/segments, legend swatches, small status
// dots paired with a separate always-dark text label, icon fills. None of
// these carry text-contrast obligations because no text is rendered
// directly on top of them in the actual screens.
export const accent = {
  green: '#00a878',
  blue: '#0d6efd',
  amber: '#f59e0b',
  red: '#de3545',
} as const;

// ISSUE 2 (fixed here): every primary CTA button in the Figma file
// ("Sign In as Supplier", "Create New Work Order", "Generate ESG Report",
// "Submit Audit Data") renders white text at 14-15px/weight 600 directly on
// accent.green — measured 3.06:1, well under the 4.5:1 AA minimum for text
// that size (it does not qualify as "large text"). action.green is the
// button-safe replacement; accent.green stays available for decorative use
// (dots, icon fills) where no text sits on top of it.
export const action = {
  green: '#008660', // was accent.green (#00a878) for this specific use
} as const;

// Status pill badges ("Completed" / "In Progress" / "Pending", etc.) in the
// Figma file are white text directly on accent.{green,blue,amber}, which
// measured 3.06:1 / 4.50:1 / 2.15:1 respectively — green and amber clearly
// fail AA, and blue sits exactly on the boundary with no safety margin.
// Rather than a fourth near-black-on-bright-amber variant (which would look
// inconsistent with the other three), every status pill uses the same
// dark-text-on-light-tint pattern, each verified >=4.5:1 in the contrast
// test — a proven accessible pattern that stays visually on-brand.
export const status = {
  success: { bg: '#e0f5ef', fg: '#007c59' }, // was white-on-accent.green
  info: { bg: '#e2eeff', fg: '#0c63e4' }, // was white-on-accent.blue
  warning: { bg: '#fef3e2', fg: '#986207' }, // was white-on-accent.amber
  danger: { bg: '#fbe7e9', fg: '#c32f3d' }, // was white-on-accent.red
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
} as const;

// Geist (headings) + Archivo (body/UI) are the actual fonts used across the
// Figma file's generated-code export — corrected here from an earlier
// Inter-based guess made before that export was available. Noto Sans HK is
// the Traditional Chinese companion, used via :lang(zh-HK) rather than
// mixed into the Latin stack, per plan §9.
export const fontFamily = {
  latin: "'Archivo', system-ui, sans-serif",
  heading: "'Geist', 'Archivo', system-ui, sans-serif",
  zhHK: "'Noto Sans HK', 'Archivo', system-ui, sans-serif",
} as const;

export const tokens = { brand, surface, border, text, accent, action, status, fontWeight, fontFamily };
