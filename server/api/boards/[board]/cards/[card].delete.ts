import type { Types } from 'mongoose'

export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const board = await BoardSchema.findById(getRouterParams(event).board)
	const card = await CardSchema.findById(getRouterParams(event).card)

	if (!board) {
		throw createError({
			statusCode: 404,
			message: 'Board not found'
		})
	}

	if (!card) {
		throw createError({
			statusCode: 404,
			message: 'Card not found'
		})
	}

	const cardInBoard = (board.cards as unknown as Types.ObjectId[]).includes(card._id)

	if (String(board.owner) !== user.id || !cardInBoard) {
		throw createError({
			statusCode: 401,
			message: 'Unauthorized'
		})
	}

	await BoardSchema.updateMany(
		{ cards: card.id },
		{ $pull: { cards: card.id } }
	)
	await card.deleteOne()
})
