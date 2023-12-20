import { googleEventHandler } from '~/server/lib/oauth/google'

export default googleEventHandler({
	async onSuccess(event, { user }) {
		await setUserSession(event, {
			user: {
				name: user.given_name || user.name,
				email: user.email,
				picture: user.picture,
				google: user.sub
			}
		})

		// TODO: user type
		// TODO: Merge user data in db
		// TODO: session exp
		// TODO: Google provides a { locale: 'en-GB' }
		// TODO: redirect to dashboard
		return sendRedirect(event, '/')
	}
})
