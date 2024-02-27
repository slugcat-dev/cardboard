// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	modules: [
		'@vueuse/nuxt',
		'nuxt-auth-utils',
		'nuxt-icon',
		'nuxt-mongoose'
	],
	runtimeConfig: {
		google: {
			clientId: '',
			clientSecret: ''
		},
		github: {
			clientId: '',
			clientSecret: ''
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
		rootId: 'root'
	},
	css: [
		'~/assets/style.scss',
		'~/assets/transitions.scss'
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
	}
})
