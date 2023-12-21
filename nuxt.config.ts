// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	modules: [
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
		pageTransition: { name: 'page', mode: 'out-in' }
	}
})
