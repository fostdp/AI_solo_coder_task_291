import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  root: 'public',
  base: '/',
  publicDir: 'assets',
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: mode === 'development',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'public/index.html'),
        test: path.resolve(__dirname, 'public/test.html')
      },
      output: {
        manualChunks: {
          engine: ['./public/molecule-engine.js']
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        correctVarValueBeforeDeclaration: true
      }
    },
    
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 3,
        dead_code: true,
        unused: true,
        conditionals: true,
        comparisons: true,
        sequences: true,
        evaluate: true,
        booleans: true,
        loops: true
      },
      mangle: {
        safari10: true,
        keep_classnames: false,
        keep_fnames: false
      },
      format: {
        comments: false
      }
    }
  },
  
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  
  preview: {
    port: 4173
  }
}));
