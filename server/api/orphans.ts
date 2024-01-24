import type { Types } from 'mongoose'

export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const boards = await BoardSchema.find()
	const cards = await CardSchema.find()
	const allCardsInBoards = boards.flatMap(board => (board.cards as unknown as Types.ObjectId[]).map(id => String(id)))
	const allCards = cards.map(card => card.id)
	const orphans = allCards.filter(id => !allCardsInBoards.includes(id))

	if (user.id !== '6584d84cd211dd3ceafe11f6') {
		throw createError({
			statusCode: 401,
			message: 'Unauthorized'
		})
	}

	return { orphans }
})
