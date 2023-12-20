export default defineEventHandler(async (event) => {
	const session = await requireUserSession(event)

	return await BoardSchema.find({ owner: session.user.google || session.user.github || undefined })
})
