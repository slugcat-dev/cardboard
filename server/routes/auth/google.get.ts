import { googleEventHandler } from '~/server/lib/oauth/google'
import { UserSchema } from '~/server/models/user.schema'

export default googleEventHandler({
	async onSuccess(event, { user }) {
		let dbUser = await UserSchema.findOne({ $or: [{ email: user.email }, { google: user.sub }] })

		if (!dbUser) {
			dbUser = await new UserSchema({
				email: user.email,
				google: user.sub
			}).save()
		}
		else if (!dbUser.google)
			await UserSchema.findOneAndUpdate({ _id: dbUser._id }, { google: user.sub })

		await setUserSession(event, {
			user: {
				id: dbUser._id,
				name: user.given_name || user.name,
				picture: user.picture
			}
		})

		return sendRedirect(event, '/boards')
	}
})
