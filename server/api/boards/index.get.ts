export default defineEventHandler(async (event) => {
	await requireUserSession(event)

	return await BoardSchema.find({ owner: event.context.user.id })
})
