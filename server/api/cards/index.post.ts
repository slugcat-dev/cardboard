export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const data = await readBody(event)
	const board = await BoardSchema.findById(data.board)

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

	const card = (await new CardSchema(data.card).save())

	await board.updateOne({ $push: { cards: card.id } })

	return card
})
