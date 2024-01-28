export default defineEventHandler(async (event) => {
	console.log(event.path)

	const { user } = await getUserSession(event)

	if (user)
		await UserSchema.findOne({ _id: user.id }).updateOne({ lastseen: new Date() })
})
