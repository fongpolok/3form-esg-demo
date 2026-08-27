import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/client/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
  },
  build: {
    commonjsOptions: {
      // See apps/ops-portal/vite.config.ts's comment on this same option —
      // @esg/shared-validation is CommonJS and reached via an npm-workspace
      // symlink outside node_modules, which Rollup's commonjs plugin
      // ignores by default.
      include: [/packages\/shared-validation/, /node_modules/],
    },
  },
});
