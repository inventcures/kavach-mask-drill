import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the same build works at / and under /<repo>/ on GitHub Pages.
  base: './',
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
  build: { target: 'es2020' },
  test: {
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
