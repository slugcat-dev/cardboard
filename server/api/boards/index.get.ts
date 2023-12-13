export default defineEventHandler(async (event) => {
	if (event.context.user)
		return await BoardSchema.find({ owner: event.context.user.id })
})
