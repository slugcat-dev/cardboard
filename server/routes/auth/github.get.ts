export default oauth.githubEventHandler({
	async onSuccess(event, { user }) {
		await setUserSession(event, { user })

		// TODO: redirect to dashboard
		return sendRedirect(event, '/')
	},
	config: {
		emailRequired: true
	}
})
