import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  esbuild: {
    // Disable TypeScript checking in production builds
    ...(mode === 'production' && {
      ignoreAnnotations: true,
      legalComments: 'none',
    }),
  },
  build: {
    // Add cache busting with hash in filenames
    rollupOptions: {
      output: {
        // Ensure assets have unique hashes for cache busting
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
      onwarn(warning, warn) {
        // Suppress specific warnings that might cause build failures
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        if (warning.code === 'CIRCULAR_DEPENDENCY') return
        warn(warning)
      },
    },
    ...(mode === 'production' && {
      minify: 'esbuild',
    }),
  },
}))