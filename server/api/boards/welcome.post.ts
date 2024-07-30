export default defineEventHandler(async (event) => {
	const { user } = await requireUserSession(event)
	const templateCards = [
		{ position: { x: 100, y: 80 }, content: 'To create **new cards** __double click__ / __tap__ the canvas\nYou can **move cards** freely by __dragging__ them around\n~~To create a **new board**, hold __Ctrl__ / __⌘__ while __double clicking__~~', type: 'text' },
		{ position: { x: 100, y: 320 }, content: '# Markdown support!\nSupports _most_ Markdown features', type: 'text' },
		{ position: { x: 360, y: 400 }, content: { title: 'Kowloon Walled City - Wikipedia', favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico', domain: 'en.wikipedia.org', url: 'https://en.wikipedia.org/wiki/Kowloon_Walled_City' }, type: 'link' },
		{ position: { x: 360, y: 460 }, content: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Kowloon_Walled_City_1991.jpg/800px-Kowloon_Walled_City_1991.jpg', type: 'image' },
		{ position: { x: 100, y: 240 }, content: '~~Join on Discord or~~ open an issue on https://github.com/slugcat-dev/cardboard/issues', type: 'text' },
		{ position: { x: 100, y: 200 }, content: '# Bugs & Feature Requests', type: 'text' },
		{ position: { x: 100, y: 40 }, content: '# Welcome', type: 'text' },
		{ position: { x: 360, y: 320 }, content: '# Add Images And Links', type: 'text' },
		{ position: { x: 360, y: 360 }, content: 'Just __drag__ them onto the board or __paste__ them into a new card!', type: 'text' }
	]
	const cards = await CardSchema.create(templateCards)

	return (await new BoardSchema({
		name: 'Welcome',
		owner: user.id,
		cards: cards.map(card => card.id)
	}).save()).populate('cards')
})
