export default defineEventHandler((event) => {
	const cookies = parseCookies(event)
	const storage = useStorage('cache')

	storage.removeItem(cookies.token)
	setCookie(event, 'token', '')

	setResponseStatus(event, 307)
	setResponseHeader(event, 'Location', '/')
})
