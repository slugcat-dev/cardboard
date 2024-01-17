import { UserSchema } from '~/server/models/user.schema'

export default oauth.googleEventHandler({
	async onSuccess(event, { user }) {
		let userLink = await UserSchema.findOne({ $or: [{ email: user.email }, { google: user.sub }] })

		if (!userLink) {
			userLink = await new UserSchema({
				email: user.email,
				google: user.sub
			}).save()
		}
		else if (!userLink.google)
			await userLink.updateOne({ google: user.sub })

		await userLink.updateOne({ lastseen: Date.now() })
		await setUserSession(event, {
			user: {
				id: userLink.id,
				name: user.given_name || user.name,
				picture: user.picture
			}
		})

		return sendRedirect(event, '/')
	}
})
