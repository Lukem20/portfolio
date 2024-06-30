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
                about: resolve(root, 'about.html'),
                sevendeadlysins: resolve(root, '/projects/7ds.html'),
                abts: resolve(root, '/projects/abts.html'),
                brandidentitytimeline: resolve(root, '/projects/bit.html'),
                graphicstextbook: resolve(root, '/projects/graphics-textbook.html'),
                healdsburgcrush: resolve(root, '/projects/hbc.html'),
                sandbox: resolve(root, '/projects/sandbox.html'),
                sisisbarbershop: resolve(root, '/projects/sb.html'),
                whatdesignerareyou: resolve(root, '/projects/wdru.html'),
            }
        },
        outDir,
        emptyOutDir: true
    },
});