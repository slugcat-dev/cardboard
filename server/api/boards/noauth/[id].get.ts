export default defineEventHandler(async (event) => {
	const board = await BoardSchema.findById(event.context.params?.id).populate('cards')

	if (!board) {
		return createError({
			statusCode: 404,
			message: 'Board not found'
		})
	}

	return board
})
