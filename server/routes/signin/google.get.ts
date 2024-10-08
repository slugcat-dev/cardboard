import { UserSchema } from '~/server/models/user.schema'

export default oauthGoogleEventHandler({
	async onSuccess(event, { user }) {
		let userLink = await UserSchema.findOne({ $or: [{ email: user.email }, { google: user.sub }] })

		if (!userLink) {
			userLink = await new UserSchema({
				email: user.email,
				google: user.sub
			}).save()
		} else if (!userLink.google)
			await userLink.updateOne({ google: user.sub })

		await setUserSession(event, {
			user: {
				id: userLink.id,
				email: user.email,
				name: user.given_name || user.name,
				picture: user.picture
			}
		})

		return sendRedirect(event, '/')
	}
})
