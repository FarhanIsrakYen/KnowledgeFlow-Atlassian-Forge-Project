import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Forge serves each static resource from a generated CDN path. Relative URLs keep
// Vite's JavaScript and CSS assets within that resource instead of requesting CDN-root paths.
export default defineConfig({ base: './', plugins: [react()], build: { outDir: 'build', emptyOutDir: true } });
