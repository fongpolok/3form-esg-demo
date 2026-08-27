import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/ops/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Lets `npm run dev` on the host reach the backend running via
    // docker-compose (published on localhost:3000) without needing
    // VITE_API_BASE_URL set — matches the api/v1 prefix main.ts sets.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    commonjsOptions: {
      // Rollup's commonjs plugin only transforms files under node_modules
      // by default. @esg/shared-validation compiles to CommonJS (it's also
      // required directly by the backend at plain-Node runtime) and is
      // reached here via an npm-workspace symlink that resolves OUTSIDE
      // node_modules — without this, Rollup falls back to a much weaker
      // built-in CJS interop and fails to see named exports like
      // `loginSchema` ("X is not exported by dist/index.js").
      include: [/packages\/shared-validation/, /node_modules/],
    },
  },
});
