import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// Component tests run in jsdom. `tsconfigPaths` resolves the `@/*` alias from
// tsconfig so specs can import app code the same way the app does. CSS is not
// processed (Tailwind v4 pipeline is irrelevant to behavior under test).
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
  },
})
