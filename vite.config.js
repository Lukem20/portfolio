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
                sevendeadlysins: resolve(root, '/projects/SevenDeadlySins.html'),
                botanyblog: resolve(root, '/projects/BotanyBlog.html'),
                brandidentitytimeline: resolve(root, '/projects/BrandIdentityTimeline.html'),
                graphicstextbook: resolve(root, '/projects/GraphicsInteractiveTextbook.html'),
                healdsburgcrush: resolve(root, '/projects/HealdsburgCrush.html'),
                sandbox: resolve(root, '/projects/ThreejsSandbox.html'),
                sisisbarbershop: resolve(root, '/projects/SisisBarbershop.html'),
                hauntedhouse: resolve(root, '/projects/HauntedHouse.html'),
            },
            output: {
                assetFileNames: (assetInfo) => {
                  if (assetInfo.name === 'swiper.js') {
                    return 'swiper-slides/swiper.js';
                  }
                  return '[name].[ext]';
                }
            }
        },
        outDir,
        emptyOutDir: true
    },
});