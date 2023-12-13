export default defineEventHandler(async (event) => {
	const cookies = parseCookies(event)
	const storage = useStorage('cache')

	event.context.user = await storage.getItem(cookies.token) as User | null
})
