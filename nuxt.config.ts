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
		oauth: {
			google: {
				clientId: '',
				clientSecret: ''
			},
			github: {
				clientId: '',
				clientSecret: ''
			},
		},
		session: {
			name: 'session',
			password: '',
			maxAge: 86400 * 30
		}
	},

	app: {
		pageTransition: { name: 'slide' },
		layoutTransition: { name: 'slide' },
		rootId: 'app'
	},

	css: [
		'~/assets/style.css',
		'~/assets/transitions.css',
		'/codemirror/style.css'
	],

	experimental: {
		asyncContext: true
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

	eslint: {
		config: {
			typescript: { strict: true },
			stylistic: {
				indent: 'tab'
			}
		}
	},

	compatibilityDate: '2024-07-21'
})
