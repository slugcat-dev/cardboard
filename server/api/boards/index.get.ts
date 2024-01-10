export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)

	return await BoardSchema.find({ owner: user.id }).populate('cards')
})
