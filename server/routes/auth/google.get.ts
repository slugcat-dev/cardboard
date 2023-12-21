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

		return sendRedirect(event, '/boards')
	}
})
