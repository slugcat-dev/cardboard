export default oauth.googleEventHandler({
	async onSuccess(event, { user }) {
		await setUserSession(event, { user })

		// TODO: redirect to dashboard
		return sendRedirect(event, '/')
	},
	config: {
		redirectUrl: 'https://pinwall.doublekekse.dev/auth/google'
	}
})
