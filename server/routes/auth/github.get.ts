import { githubEventHandler } from '~/server/lib/oauth/github'
import { UserSchema } from '~/server/models/user.schema'

export default githubEventHandler({
	async onSuccess(event, { user }) {
		let dbUser = await UserSchema.findOne({ $or: [{ email: user.email }, { github: user.id }] })

		if (!dbUser) {
			dbUser = await new UserSchema({
				email: user.email,
				github: user.github
			}).save()
		}
		else if (!dbUser.github)
			await UserSchema.findOneAndUpdate({ _id: dbUser._id }, { github: user.id })

		await setUserSession(event, {
			user: {
				id: dbUser._id,
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
