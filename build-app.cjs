const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function runBuild() {
  console.log('--- STARTING DYNAMIC BUILD (CJS with ESM Bridge) ---');
  
  try {
    // ใช้ Dynamic Import เพื่อโหลดโมดูลที่เป็น ESM เท่านั้น
    const { build } = await import('vite');
    const { default: react } = await import('@vitejs/plugin-react');
    const { default: tailwindcss } = await import('@tailwindcss/vite');

    await build({
      root: process.cwd(),
      base: './',
      configFile: false, // ข้ามการโหลดไฟล์อัตโนมัติเพื่อเลี่ยงปัญหา Permission
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
