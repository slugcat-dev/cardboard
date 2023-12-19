export default defineEventHandler(async (event) => {
	await requireUserSession(event)

	const _id = event.context.params?._id

	await BoardSchema.updateMany(
		{ cards: _id },
		{ $pull: { cards: _id } }
	)
	await CardSchema.deleteOne({ _id })
})
