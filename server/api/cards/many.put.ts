export default defineEventHandler(async (event) => {
	const cards = await readBody(event)

	await CardSchema.bulkWrite(cards.map((card: Card) => ({
		updateOne: {
			filter: { _id: card.id },
			update: card
		}
	})))
})
