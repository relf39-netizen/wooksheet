const { build } = require('vite');
const react = require('@vitejs/plugin-react');
const tailwindcss = require('@tailwindcss/vite').default || require('@tailwindcss/vite');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars if .env exists
dotenv.config();

async function runBuild() {
  console.log('Starting custom build process...');
  console.log('Current directory:', process.cwd());

  try {
    await build({
      // บังคับให้ root อยู่ที่นี่เท่านั้น
      root: process.cwd(),
      base: './',
      configFile: false, // ข้ามการโหลดไฟล์ config อัตโนมัติเพื่อเลี่ยงปัญหา Permission
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
        reportCompressedSize: false,
        rollupOptions: {
           // ปรับปรุงการจัดการ path บน Windows
           output: {
             format: 'es',
           }
        }
      },
      logLevel: 'info'
    });
    console.log('--- BUILD SUCCESSFUL ---');
  } catch (error) {
    console.error('--- BUILD FAILED ---');
    console.error(error);
    process.exit(1);
  }
}

runBuild();
