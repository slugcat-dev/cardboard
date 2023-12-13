// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: ['nuxt-icon', 'nuxt-mongoose'],
	mongoose: {
		uri: 'mongodb+srv://dev:5BwxpBE7RH0pOltF@dev.ndafsw1.mongodb.net/?retryWrites=true&w=majority'
	},
	devtools: {
		enabled: true
	}
})
