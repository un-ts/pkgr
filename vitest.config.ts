import autoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    autoImport({
      imports: ['vitest'],
    }),
  ],
  test: {
    coverage: {
      provider: 'istanbul',
    },
  },
})
