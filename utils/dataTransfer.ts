// TODO ---
// Handle pasted and dropped data
export async function handleDataTransfer(dataTransfer: DataTransfer, position: Position, card?: Card, textOnly?: boolean, withoutFormatting?: boolean) {
	// const files = Array.from(dataTransfer.files)
	const items = Array.from(dataTransfer.items)

	for (const file of dataTransfer.files) {
		if (textOnly)
			break

		if (file.type.startsWith('image')) {
			const img = await blobToBase64(file)

			if (card) {
				card.id = 'new:create'
				card.type = 'image'
				card.content = img

				fetchUpdateCard(card)
			} else {
				createCard({
					id: 'new:create',
					type: 'image',
					position,
					content: img
				})
			}
		}
	}

	if (dataTransfer.files.length > 0 && !textOnly)
		return

	let mode = null
	let text = null
	let url = null
	let cards = null

	const tasks = items.map((item) => {
		return new Promise<void>((resolve) => {
			// TODO: multiple urls
			if (item.type === 'text/uri-list')
				url = dataTransfer.getData('URL')

			if (item.type === 'text/plain') {
				item.getAsString((data) => {
					text = data

					resolve()
				})
			} else if (item.type === 'vscode-editor-data') {
				item.getAsString((json) => {
					try {
						const data = JSON.parse(json)

						mode = data.mode

						resolve()
					} catch {}
				})
			} else if (item.type === 'card-data') {
				item.getAsString((json) => {
					try {
						const data = JSON.parse(json)

						cards = data

						resolve()
					} catch {}
				})
			} else
				resolve()
		})
	})

	await Promise.all(tasks)

	const fence = '```'

	if (cards && !card)
		return pasteCards(cards, position)

	if (url)
		text = url

	if (text) {
		if (!textOnly && (url || /https?:\/\/[^\W_](?:[\w-]*[^\W_])?(?:\.[^\W_](?:[\w-]*[^\W_])?)*(?::\d{1,5})?(?:\/[^\s<]*)?/i.test(text))) {
			const linkPreview = await getLinkPreview(text)

			if (linkPreview) {
				if ('isImage' in linkPreview && linkPreview.isImage) {
					if (card) {
						card.id = 'new:create'
						card.type = 'image'
						card.content = linkPreview.url

						fetchUpdateCard(card)

						return
					}

					return createCard({
						id: 'new:create',
						position,
						type: 'image',
						content: linkPreview.url
					})
				}

				if (card) {
					card.id = 'new:create'
					card.type = 'link'
					card.content = linkPreview

					fetchUpdateCard(card)

					return
				}

				return createCard({
					id: 'new:create',
					position,
					type: 'link',
					content: linkPreview
				})
			}
		}

		if (mode && !['plaintext', 'markdown'].includes(mode)) {
			if (mode === 'javascript')
				mode = 'js'
			else if (mode === 'typescript')
				mode = 'ts'
			else if (mode === 'csharp')
				mode = 'cs'
			else if (mode === 'javascriptreact')
				mode = 'jsx'
			else if (mode === 'typescriptreact')
				mode = 'tsx'

			if (text.includes('\n'))
				text = `${fence}${mode}\n${text}\n${fence}`
			else
				text = `\`${text}\``
		} else {
			text = wrap(text)
		}

		if (card)
			return { mode, text }

		createCard({
			id: 'new:create',
			position,
			content: text
		})
	}
}

// TODO: paste without formatting
function wrap(text: string) {
	const s = 60

	const lines = text.split('\n')

	text = lines.map((line) => {
		if (line.length < s)
			return line

		let i, j

		for (i = s; i < line.length; i++)
			if (/\s/.test(line[i]))
				break

		for (j = s; j > 0; j--)
			if (/\s/.test(line[j]))
				break

		if (i - s > s - j)
			i = j

		if (i === line.length)
			return line

		return line.slice(0, i) + '\n' + wrap(line.slice(i + 1))
	}).join('\n')

	return text
}

function pasteCards(cards: Card[], pos: Position) {
	if (cards.length === 0)
		return

	const initialPos = cards[0].position

	cards.forEach((c) => {
		const offsetX = c.position.x - initialPos.x
		const offsetY = c.position.y - initialPos.y

		createCard({
			...c,
			id: 'new:create',
			position: {
				x: pos.x + offsetX,
				y: pos.y + offsetY
			}
		})
	})
}
