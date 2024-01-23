export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const board = await BoardSchema.findById(getRouterParams(event).board)

	if (!board) {
		throw createError({
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

	await CardSchema.deleteMany({ $or: [
		{ _id: { $in: board.cards } },
		{ content: board.id }
	] })
	await board.deleteOne()
})
