export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const { parent } = await readBody(event)

	return await new BoardSchema({
		name: 'New Board',
		owner: user.id,
		parent
	}).save()
})
