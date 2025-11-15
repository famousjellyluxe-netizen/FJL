import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  root: './',
  plugins: [
    {
      name: 'copy-html-and-js-files',
      apply: 'build',
      enforce: 'post',
      generateBundle() {
        // Copy all HTML files to dist
        const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
        htmlFiles.forEach(file => {
          const content = fs.readFileSync(file, 'utf-8');
          this.emitFile({
            type: 'asset',
            fileName: file,
            source: content
          });
        });

        // Copy all root-level JS files to dist
        const rootJsFiles = fs.readdirSync('.').filter(f => f.endsWith('.js') && !f.includes('vite') && !f.includes('node_modules'));
        rootJsFiles.forEach(file => {
          const content = fs.readFileSync(file, 'utf-8');
          this.emitFile({
            type: 'asset',
            fileName: file,
            source: content
          });
        });

        // Helper function to recursively copy directories
        const copyDir = (dir, prefix = '') => {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              const content = fs.readFileSync(filePath, 'utf-8');
              this.emitFile({
                type: 'asset',
                fileName: path.join(prefix, file),
                source: content
              });
            } else if (stat.isDirectory()) {
              copyDir(filePath, path.join(prefix, file));
            }
          });
        };

        // Copy js/ directory to dist/js/
        if (fs.existsSync('./js')) {
          copyDir('./js', 'js');
        }

        // Copy admin/ directory to dist/admin/
        if (fs.existsSync('./admin')) {
          copyDir('./admin', 'admin');
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    minify: false,
    copyPublicDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
