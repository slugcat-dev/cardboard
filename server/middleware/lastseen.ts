export default defineEventHandler(async (event) => {
	if (import.meta.dev)
		console.log(event.path)

	const { user } = await getUserSession(event)

	if (user)
		await UserSchema.findOne({ _id: user.id }).updateOne({ lastseen: new Date() })
})
