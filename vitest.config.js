import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.{test,spec}.js', 'test/**/test.js'],
    globalSetup: './test/setup.js',
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        {
          browser: 'chromium',
          launch: {
            executablePath: '/usr/bin/chromium',
          },
        },
      ],
    },
  },
})
