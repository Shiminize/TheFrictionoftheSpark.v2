import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/TheFrictionoftheSpark.v2/',
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
});
