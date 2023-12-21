import { githubEventHandler } from '~/server/lib/oauth/github'

export default githubEventHandler({
	async onSuccess(event, { user }) {
		await setUserSession(event, {
			user: {
				name: user.name || user.login,
				email: user.email,
				picture: user.avatar_url,
				github: user.id
			}
		})

		return sendRedirect(event, '/boards')
	},
	config: {
		emailRequired: true
	}
})
