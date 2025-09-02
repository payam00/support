import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import vitePluginImp from 'vite-plugin-imp'

export default defineConfig({
    base: '/widget/',

  plugins: [
    react(),
    // این دو پلاگین برای بهینه‌سازی نگه داشته می‌شوند
    visualizer({ open: true }),
    vitePluginImp({
      libList: [
        {
          libName: 'antd',
          style: (name) => `antd/es/${name}/style`,
        },
      ],
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },

  define: {
    // شبیه‌سازی کامل process.env
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },

  build: {
    rollupOptions: {
      input: {
        // نقطه ورود برنامه
        main: path.resolve(process.cwd(), 'src/main.tsx'),
      },
      output: {
        // نام فایل‌های خروجی بدون هش
        entryFileNames: 'widget.js',
        chunkFileNames: 'WidgetCore.js',
        assetFileNames: 'widget.[ext]',
      },
    },
  },

  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis', // برای کتابخانه‌هایی که دنبال global هستند
      },
    },
  },
})
