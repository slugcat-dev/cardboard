export default defineEventHandler(async (event) => {
	const card = await readBody(event)

	await CardSchema.findOneAndUpdate({ _id: event.context.params?._id }, card, { new: true })
})
