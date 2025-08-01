import { defineConfig } from 'cypress'

// Use "export default" instead of "module.exports"
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5174',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})
