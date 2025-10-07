import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
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
    include: ['test/**/test.js'],
    testTimeout: 10000,
  },
})
