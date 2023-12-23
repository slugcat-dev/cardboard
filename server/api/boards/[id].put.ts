export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const board = await BoardSchema.findById(event.context.params?.id)

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

	const data = await readBody(event)

	return await board.updateOne(data, { new: true })
})
