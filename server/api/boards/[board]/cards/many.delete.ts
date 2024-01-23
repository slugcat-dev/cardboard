import type { Types } from 'mongoose'

export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const board = await BoardSchema.findById(getRouterParams(event).board)
	const ids = await readBody<string[]>(event)

	if (!board) {
		throw createError({
			statusCode: 404,
			message: 'Board not found'
		})
	}

	const allCardsInBoard = ids.every(card => (board.cards as unknown as Types.ObjectId[]).some(id => String(id) === card))

	if (String(board.owner) !== user.id || !allCardsInBoard) {
		throw createError({
			statusCode: 401,
			message: 'Unauthorized'
		})
	}

	await BoardSchema.updateMany(
		{ cards: { $in: ids } },
		{ $pull: { cards: { $in: ids } } }
	)
	await CardSchema.deleteMany({ _id: { $in: ids } })
})
