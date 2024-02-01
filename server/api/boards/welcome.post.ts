export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const templateCards = [
		{ position: { x: 100, y: 80 }, content: 'To create <b>new cards</b> <u>double click</u> / <u>tap</u> the canvas<br>You can <b>move cards</b> freely by <u>dragging</u> them around<br>To create a <b>new board</b>, hold <u>Ctrl</u> / <u>⌘</u> while <u>double clicking</u>', type: 'text' },
		{ position: { x: 100, y: 320 }, content: { title: 'How To Create A Tasklist', tasks: [{ content: 'hold shift', done: false }, { content: 'double click', done: false }, { content: 'done', done: false }] }, type: 'tasklist' },
		{ position: { x: 360, y: 400 }, content: { title: 'Kowloon Walled City - Wikipedia', favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico', domain: 'en.wikipedia.org', url: 'https://en.wikipedia.org/wiki/Kowloon_Walled_City' }, type: 'link' },
		{ position: { x: 360, y: 460 }, content: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Kowloon_Walled_City_1991.jpg/800px-Kowloon_Walled_City_1991.jpg', type: 'image' },
		{ position: { x: 100, y: 240 }, content: 'Join on <a href="https://discord.gg/qPQqbBfvSM">Discord</a> or open an issue on <a href="https://github.com/slugcat-dev/cardboard/issues">GitHub</a>', type: 'text' },
		{ position: { x: 100, y: 200 }, content: '<h1>Bugs &amp; Feature Requests</h1>', type: 'text' },
		{ position: { x: 100, y: 40 }, content: '<h1>Welcome</h1>', type: 'text' },
		{ position: { x: 360, y: 320 }, content: '<h1>Add Images And Links</h1>', type: 'text' },
		{ position: { x: 360, y: 360 }, content: 'Just <u>drag</u> them onto the board or <u>paste</u> them into a new card!', type: 'text' }
	]
	const cards = await CardSchema.create(templateCards)

	return (await new BoardSchema({
		name: 'Welcome',
		owner: user.id,
		cards: cards.map(card => card.id)
	}).save()).populate('cards')
})
