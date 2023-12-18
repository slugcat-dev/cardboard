export default defineEventHandler(async (event) => {
	if (!event.context.user)
		return

	const title = await readBody(event)

	return (await new BoardSchema({ name: title || 'New Board', owner: event.context.user.id }).save())._id
})
