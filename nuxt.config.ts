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
			password: ''
		}
	},
	mongoose: {
		uri: 'mongodb+srv://dev:5BwxpBE7RH0pOltF@dev.ndafsw1.mongodb.net/?retryWrites=true&w=majority'
	},
	app: {
		pageTransition: { name: 'slide' },
		layoutTransition: { name: 'slide' },
		rootId: 'root'
	},
	css: ['~/assets/style.scss'],
	experimental: {
		asyncContext: true
	}
})
