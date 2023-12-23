export default defineEventHandler(async (event) => {
	await requireUserSession(event)

	const card = await CardSchema.findOne({ id: event.context.params?.id })

	if (!card) {
		return createError({
			statusCode: 404,
			message: 'Card not found'
		})
	}

	const data = await readBody(event)

	return await card.updateOne(data, { new: true })
})
