export default defineEventHandler(async (event) => {
	// https://github.com/Atinux/nuxt-todos-edge/blob/main/server/api/todos/%5Bid%5D.delete.ts
	await requireUserSession(event)

	const _id = event.context.params?._id

	await BoardSchema.updateMany(
		{ cards: _id },
		{ $pull: { cards: _id } }
	)
	await CardSchema.deleteOne({ _id })
})
