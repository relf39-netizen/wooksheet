const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function runBuild() {
  console.log('--- STARTING STABLE BUILD (Tailwind v3 + Vite 5) ---');
  
  try {
    const { build } = await import('vite');
    const { default: react } = await import('@vitejs/plugin-react');

    await build({
      root: process.cwd(),
      base: './',
      configFile: false, // ข้ามการโหลดไฟล์อัตโนมัติเพื่อเลี่ยงปัญหา Permission
      plugins: [
        react()
        // ใน Tailwind v3 ระบบจะเรียกผ่าน PostCSS อัตโนมัติถ้ามีไฟล์ postcss.config.js
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
           output: {
             format: 'es',
           }
        }
      }
    });
    console.log('--- BUILD SUCCESSFUL ---');
  } catch (error) {
    console.error('--- BUILD FAILED ---');
    console.error(error);
    process.exit(1);
  }
}

runBuild();
