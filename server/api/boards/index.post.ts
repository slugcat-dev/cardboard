export default defineEventHandler(async (event) => {
	const session = await requireUserSession(event)
	const title = await readBody(event)

	return (await new BoardSchema({ name: title || 'New Board', owner: session.user.email }).save())._id
})
