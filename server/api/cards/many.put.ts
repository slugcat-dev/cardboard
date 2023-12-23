export default defineEventHandler(async (event) => {
	const cards = await readBody(event)

	await Promise.all(cards.map(async (card: Card) => {
		await CardSchema.updateOne({ _id: card.id }, card)
	}))
})
