export default defineEventHandler(async (event) => {
	if (process.dev)
		console.log(event.path)

	const { user } = await getUserSession(event)

	if (user)
		await UserSchema.findOne({ _id: user.id }).updateOne({ lastseen: new Date() })
})
