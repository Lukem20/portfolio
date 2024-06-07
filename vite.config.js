import { defineConfig } from "vite";
import { resolve } from 'path';

const root = resolve(__dirname, 'src')
const outDir = resolve(__dirname, 'dist')

export default defineConfig({
    root,
    build: {
        rollupOptions: {
            input: {
                main: resolve(root, 'index.html'),
                about: resolve(root, 'about.html')
            }
        },
        outDir,
        emptyOutDir: true
    },
});