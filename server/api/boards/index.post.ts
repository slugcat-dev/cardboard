export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const title = await readBody(event)

	return (await new BoardSchema({
		name: title || 'New Board',
		owner: user.id
	}).save()).id
})
