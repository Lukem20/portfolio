import path from 'path';
import fs from 'fs';

export default function serveStaticPlugin() {
	return {
		name: 'vite-plugin-serve-static',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (req.url.startsWith('/swiper-slides/')) {
				const filePath = path.join(process.cwd(), 'src', req.url);
					if (fs.existsSync(filePath)) {
						res.setHeader('Content-Type', 'application/javascript');
						fs.createReadStream(filePath).pipe(res);
						return;
					}
				}
				next();
			});
		}
	};
}