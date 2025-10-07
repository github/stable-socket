import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [
        {
          browser: 'chromium',
        },
      ],
    },
  },
})
