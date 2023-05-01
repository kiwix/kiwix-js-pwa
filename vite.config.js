import { defineConfig } from "vite";
import legacy from '@vitejs/plugin-legacy'

export default {
  server: {
    hmr: {
      overlay: false
    }
  },
  plugins: [
    legacy({
      targets: ['defaults', 'last 2 versions and not dead, > 0.3%, Firefox ESR'],
    }),
  ],
};