export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const id = event.context.params?.id
	const board = await BoardSchema.findById(id)

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

	await CardSchema.deleteMany({ _id: { $in: board.cards } })
	await CardSchema.deleteMany({ content: id })
	await board.deleteOne()
})
