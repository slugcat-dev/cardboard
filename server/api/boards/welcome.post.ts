import { Types } from 'mongoose'

export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const cards = [{ position: { x: 100, y: 80 }, _id: '6596cfcffc9ab60fac48726e', type: 'text', created: '2024-01-04T15:32:26.810Z', content: '<u>double click</u>&nbsp;/ <u>tap</u>&nbsp;the canvas to <b>create new cards</b><br>you can <b>move cards</b>&nbsp;freely&nbsp;by <u>dragging</u> them around' }, { position: { x: 440, y: 300 }, _id: '6596cfddfc9ab60fac487274', type: 'tasklist', created: '2024-01-04T15:33:43.228Z', content: { title: 'How To Create A Tasklist', tasks: [{ content: 'hold shift', done: false }, { content: 'double click', done: false }, { content: 'done', done: false }] } }, { position: { x: 100, y: 380 }, _id: '6596cff7fc9ab60fac48727e', type: 'link', created: '2024-01-04T15:34:12.079Z', content: { title: 'Kowloon Walled City - Wikipedia', favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Kowloon_Walled_City_-_1989_Aerial.jpg/1200px-Kowloon_Walled_City_-_1989_Aerial.jpg', domain: 'en.wikipedia.org', url: 'https://en.wikipedia.org/wiki/Kowloon_Walled_City' } }, { position: { x: 100, y: 440 }, _id: '6596cffefc9ab60fac487282', type: 'image', created: '2024-01-04T15:34:21.580Z', content: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Kowloon_Walled_City_1991.jpg/800px-Kowloon_Walled_City_1991.jpg' }, { position: { x: 100, y: 220 }, _id: '6596d00efc9ab60fac487286', type: 'text', created: '2024-01-04T15:34:37.554Z', content: 'Join on <a href="https://discord.gg/qPQqbBfvSM">Discord</a> or open an issue on <a href="https://github.com/slugcat-dev/cardboard/issues">GitHub</a>' }, { position: { x: 100, y: 180 }, _id: '6596d055fc9ab60fac487296', type: 'text', created: '2024-01-04T15:35:34.944Z', content: '<h2 style="\n    margin: 0;\n">Bugs &amp; Feature Requests</h2>\n' }, { position: { x: 100, y: 40 }, _id: '6596d083fc9ab60fac4872a2', type: 'text', created: '2024-01-04T15:36:31.232Z', content: '<h2 style="\n    margin:  0;\n">Welcome</h2>' }, { position: { x: 100, y: 300 }, _id: '6596d0a1fc9ab60fac4872a8', type: 'text', created: '2024-01-04T15:36:56.911Z', content: '<h2 style="\n    margin:  0;\n">Add Images And Links</h2>' }, { position: { x: 100, y: 340 }, _id: '6596d0e1fc9ab60fac4872bb', type: 'text', created: '2024-01-04T15:37:58.518Z', content: 'Just <u>paste</u> them into a new card!' }]

	await CardSchema.bulkWrite(cards.map(card => ({
		updateOne: {
			filter: { _id: new Types.ObjectId(card._id) },
			update: card,
			upsert: true
		}
	})))

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
			'6596c9a5b86153f508bd021e',
			'6596cfcffc9ab60fac48726e',
			'6596cfddfc9ab60fac487274',
			'6596cff7fc9ab60fac48727e',
			'6596cffefc9ab60fac487282',
			'6596d00efc9ab60fac487286',
			'6596d055fc9ab60fac487296',
			'6596d083fc9ab60fac4872a2',
			'6596d0a1fc9ab60fac4872a8',
			'6596d0e1fc9ab60fac4872bb'
		]
	}).save()).populate('cards')
})
