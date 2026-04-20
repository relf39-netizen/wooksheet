import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // กำหนด root ให้เป็นที่ปัจจุบันป้องกันการสแกนเกินขอบเขต
    root: process.cwd(),
    base: './',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      // บังคับให้ใช้ path แบบสัมพัทธ์ในไฟล์ที่ build ออกมา
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    server: {
      fs: {
        // จำกัดพื้นที่การอ่านไฟล์ให้อยู่แค่ในโฟลเดอร์โปรเจกต์เท่านั้น
        strict: true,
        allow: [path.resolve(__dirname)]
      },
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
