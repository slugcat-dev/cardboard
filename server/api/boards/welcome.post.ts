export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)

	return (await new BoardSchema({
		name: 'Welcome',
		owner: user.id,
		cards: [
			'6596c20bb86153f508bd00c9',
			'6596c2b7b86153f508bd00fc',
			'6596c445b86153f508bd0136',
			'6596c4bbb86153f508bd0159',
			'6596c5efb86153f508bd019d',
			'6596c662b86153f508bd01d0',
			'6596c723b86153f508bd01f9',
			'6596c9a5b86153f508bd021e'
		]
	}).save())
})
