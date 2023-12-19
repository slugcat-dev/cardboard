export default oauth.googleEventHandler({
	async onSuccess(event, { user }) {
		await setUserSession(event, { user })

		// TODO: redirect to dashboard
		return sendRedirect(event, '/')
	}
})
