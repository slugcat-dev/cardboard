export default defineEventHandler(async (event) => {
	return await BoardSchema.findById(event.context.params?._id).populate('cards')
})
