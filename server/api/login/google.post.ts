import { randomBytes } from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'

export default defineEventHandler(async (event) => {
	// CSRF validation
	const cookies = parseCookies(event)
	const body = await readBody(event)
	const csrfTokenCookie = cookies.g_csrf_token
	const csrfTokenBody = body.g_csrf_token

	if (!csrfTokenCookie || !csrfTokenBody) {
		return createError({
			statusCode: 400,
			statusMessage: 'No CSRF token'
		})
	}

	if (csrfTokenCookie !== csrfTokenBody) {
		return createError({
			statusCode: 400,
			statusMessage: 'Failed to verify double submit cookie.'
		})
	}

	// JWT validation
	const client = new OAuth2Client()
	const ticket = await client.verifyIdToken({
		idToken: body.credential,
		audience: process.env.GOOGLE_CLIENT_ID
	})

	// Signin
	const payload = ticket.getPayload()
	const token = randomBytes(64).toString('hex')
	const user = {
		id: payload?.sub,
		name: payload?.given_name,
		picture: payload?.picture
	}
	const storage = useStorage('cache')

	await storage.setItem(token, user)
	setCookie(
		event,
		'token',
		token,
		{
			secure: true,
			httpOnly: true,
			maxAge: 604800
		}
	)

	setResponseStatus(event, 307)
	setResponseHeader(event, 'Location', '/')
})
