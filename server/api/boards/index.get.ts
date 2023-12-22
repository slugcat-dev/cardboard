export default defineEventHandler(async (event) => {
	const session = await requireUserSession(event)

	return await BoardSchema.find({ owner: session.user.id })
})
