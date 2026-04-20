const { build } = require('vite');
const react = require('@vitejs/plugin-react');
const tailwindcss = require('@tailwindcss/vite').default || require('@tailwindcss/vite');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function runBuild() {
  console.log('Starting School-OS style build process...');
  
  try {
    await build({
      root: process.cwd(),
      base: './',
      configFile: false,
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
    console.log('Build completed successfully.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild();
