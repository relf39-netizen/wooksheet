import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

// ปิดการใช้ esbuild worker เพื่อลดการสแกนระบบไฟล์บน Windows
process.env.ESBUILD_WORKER = 'false';

async function runBuild() {
  console.log('--- STARTING PROGRAMMATIC BUILD (ESM) ---');
  console.log('Current directory:', process.cwd());

  try {
    await build({
      root: process.cwd(),
      base: './',
      configFile: false, // สำคัญ: ข้ามการโหลดไฟล์อัตโนมัติเพื่อเลี่ยงปัญหา Permission
      plugins: [
        react(),
        tailwindcss()
      ],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
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
        minify: 'esbuild',
        rollupOptions: {
          output: {
            format: 'es',
          }
        },
        // ปิดการใช้ Worker ถ้าเป็นไปได้เพื่อลดการข้ามขอบเขตกองทุน (ถ้า Vite รองรับ)
        sourcemap: false
      }
    });
    console.log('--- BUILD COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('--- BUILD FAILED ---');
    console.error(error);
    process.exit(1);
  }
}

runBuild();
