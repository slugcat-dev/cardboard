export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const { parent } = await readBody(event)

	const board = await new BoardSchema({
		name: 'New Board',
		owner: user.id
	}).save()

	if (parent)
		await board.updateOne({ parent })

	return board
})
