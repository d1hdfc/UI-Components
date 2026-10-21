import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'lib',
    lib: {
      entry: resolve(rootDirectory, 'src/library.bundle.ts'),
      name: 'HdfcUiComponents',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
      cssFileName: 'style'
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime']
    }
  }
});
