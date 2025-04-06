import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    coverage: {
      enabled: true,
      include: ['packages/**/*.ts'],
      provider: 'istanbul',
      reporter: ['lcov', 'json', 'text'],
    },
  },
})
