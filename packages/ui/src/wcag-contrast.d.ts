// wcag-contrast ships no types; this covers the two functions this
// codebase actually calls (tokens.contrast.test.ts).
declare module 'wcag-contrast' {
  export function hex(colorA: string, colorB: string): number;
  export function rgb(
    colorA: [number, number, number],
    colorB: [number, number, number],
  ): number;
}
