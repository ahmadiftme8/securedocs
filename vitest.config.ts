import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Move setup file to src directory to avoid conflict with Playwright
    setupFiles: './src/test-setup.ts',
    globals: true,
    environment: 'jsdom',
    // Only include component tests from src directory
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Exclude the tests folder (used by Playwright)
    exclude: ['tests/**/*', 'cypress/**/*', 'e2e/**/*', 'node_modules/**/*'],
  },
})
