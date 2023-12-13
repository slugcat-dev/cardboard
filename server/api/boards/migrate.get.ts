export default defineEventHandler(async () => {
	return
	const cards = await CardSchema.find({})

	cards.forEach(async (card) => {
		await BoardSchema.findOneAndUpdate({ _id: '656f53626c5e6f901b94ec14' }, { $push: { cards: card._id } })
	})
})
