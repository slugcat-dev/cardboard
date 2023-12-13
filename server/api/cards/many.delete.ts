export default defineEventHandler(async (event) => {
	const ids = await readBody(event)

	console.log(ids)

	await BoardSchema.updateMany(
		{ cards: { $in: ids } },
		{ $pull: { cards: { $in: ids } } }
	)
	await CardSchema.deleteMany({ _id: { $in: ids } })
})
