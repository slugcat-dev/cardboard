export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const card = await readBody(event)
	const _id = (await new CardSchema(card).save())._id

	await BoardSchema.findOneAndUpdate({ _id: query.board?.toString() }, { $push: { cards: _id } })

	return _id
})
