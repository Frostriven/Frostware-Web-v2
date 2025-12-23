import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022', // Support top-level await
    modulePreload: false, // Disable module preloading that might cause issues
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks: undefined,
        format: 'es',
        // Force new file names on each build to bypass cache
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
    },
  },
  experimental: {
    renderBuiltUrl(filename) {
      return '/' + filename;
    }
  }
});
