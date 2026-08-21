import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			// GitHub Pages serves a project site from a sub-path, so the app has to
			// know it is not at the root. BASE_PATH is set by the deploy workflow and
			// left unset locally, which keeps `npm run dev` at http://localhost:5173/.
			paths: {
				base: (process.env.BASE_PATH ?? '') as '' | `/${string}`
			},

			compilerOptions: {
				// Runes everywhere in our own code; leave node_modules on the default.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// The app is a single-page application: every route renders in the browser,
			// so the production build is a folder of static files that can be served by
			// any static host (or `npm run preview` locally). See README > Assumptions.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: false,
				strict: false
			})
		})
	],

	server: {
		port: 5173
	},

	build: {
		// Source maps make the deployed bundle debuggable without a separate build.
		sourcemap: true
	}
});
