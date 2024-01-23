import { Types } from 'mongoose'

export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const board = await BoardSchema.findById(getRouterParams(event).board)
	const cards = await readBody<Card[]>(event)

	if (!board) {
		throw createError({
			statusCode: 404,
			message: 'Board not found'
		})
	}

	const allCardsInBoard = cards.every(card => (board.cards as unknown as Types.ObjectId[]).some(id => String(id) === card.id))

	if (String(board.owner) !== user.id || !allCardsInBoard) {
		throw createError({
			statusCode: 401,
			message: 'Unauthorized'
		})
	}

	await CardSchema.bulkWrite(cards.map((card: Card) => ({
		updateOne: {
			filter: { _id: new Types.ObjectId(card.id) },
			update: card
		}
	})))
})
