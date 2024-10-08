// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },

	modules: [
		'@vueuse/nuxt',
		'nuxt-auth-utils',
		'@nuxt/icon',
		'nuxt-mongoose',
		'@nuxt/eslint'
	],

	runtimeConfig: {
		session: {
			name: 'session',
			maxAge: 60 * 60 * 24 * 365
		}
	},

	app: {
		rootAttrs: { id: 'app' }
	},

	css: [
		'~/assets/style.css',
		'~/assets/codemirror.css'
	],

	experimental: {
		asyncContext: true
	},

	eslint: {
		config: {
			typescript: { strict: true },
			stylistic: {
				indent: 'tab'
			}
		}
	},

	vite: {
		build: {
			target: 'esnext'
		}
	},

	nitro: {
		esbuild: {
			options: {
				target: 'esnext'
			}
		}
	},

	compatibilityDate: '2024-07-21'
})
