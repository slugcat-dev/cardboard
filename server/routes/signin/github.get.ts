import { UserSchema } from '~/server/models/user.schema'

export default oauth.githubEventHandler({
	async onSuccess(event, { user }) {
		let userLink = await UserSchema.findOne({ $or: [{ email: user.email }, { github: user.id }] })

		if (!userLink) {
			userLink = await new UserSchema({
				email: user.email,
				github: user.github
			}).save()
		}
		else if (!userLink.github)
			await userLink.updateOne({ github: user.id })

		await setUserSession(event, {
			user: {
				id: userLink.id,
				name: user.name || user.login,
				picture: user.avatar_url
			}
		})

		return sendRedirect(event, '/boards')
	},
	config: {
		emailRequired: true
	}
})
