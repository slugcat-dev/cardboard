export default defineEventHandler(async (event) => {
	await requireUserSession(event)

	const id = event.context.params?.id
	const card = await CardSchema.findOne({ id: event.context.params?.id })

	if (!card) {
		return createError({
			statusCode: 404,
			message: 'Card not found'
		})
	}

	await BoardSchema.updateMany(
		{ cards: id },
		{ $pull: { cards: id } }
	)
	await card.deleteOne()
})
