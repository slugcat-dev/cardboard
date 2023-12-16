export default defineEventHandler(async (event) => {
	const board = await readBody(event)

	await BoardSchema.findOneAndUpdate({ _id: event.context.params?._id }, board, { new: true })
})
