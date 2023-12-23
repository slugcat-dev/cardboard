export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const board = await BoardSchema.findById(event.context.params?.id).populate('cards')

	if (!board) {
		return createError({
			statusCode: 404,
			message: 'Board not found'
		})
	}

	if (String(board.owner) !== user.id) {
		throw createError({
			statusCode: 401,
			message: 'Unauthorized'
		})
	}

	return board
})
