export * from './tokens';

// Real shadcn/Radix component source (plan §7/§2's Figma-generated-code
// export — see the implementation plan) — consumed as plain TSX source by
// Vite/esbuild, never compiled to a CJS bundle, so unlike
// shared-validation/shared-types this is safe to re-export with `export *`.
export * from './components/button';
export * from './components/card';
export * from './components/badge';
export * from './components/table';
export * from './components/tabs';
export * from './components/accordion';
export * from './components/select';
export * from './components/input';
export * from './components/label';
export * from './components/dialog';
export * from './components/dropdown-menu';
export * from './components/avatar';
export * from './components/separator';
export * from './components/chart';
export * from './components/sonner';
export * from './components/utils';
