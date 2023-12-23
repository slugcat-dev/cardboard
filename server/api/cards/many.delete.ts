export default defineEventHandler(async (event) => {
	await requireUserSession(event)

	const ids = await readBody(event)

	await BoardSchema.updateMany(
		{ cards: { $in: ids } },
		{ $pull: { cards: { $in: ids } } }
	)
	await CardSchema.deleteMany({ id: { $in: ids } })
})
