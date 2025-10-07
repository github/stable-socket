import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.{test,spec}.js', 'test/**/test.js'],
    globalSetup: './test/setup.js',
    testTimeout: 30000,
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [
        {
          browser: 'chromium',
          launch: {
            executablePath: '/usr/bin/chromium',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          },
        },
      ],
    },
  },
})
