// TODO ---
// Handle pasted and dropped data
export async function handleDataTransfer(dataTransfer: DataTransfer, position: Position, card?: Card) {
	// const files = Array.from(dataTransfer.files)
	const items = Array.from(dataTransfer.items)

	for (const file of dataTransfer.files) {
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

	if (dataTransfer.files.length > 0)
		return

	let mode = null
	let text = null
	let url = null

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
			} else
				resolve()
		})
	})

	await Promise.all(tasks)

	const fence = '```'

	if (url)
		text = url

	if (text) {
		if (url || /https?:\/\/[^\W_](?:[\w-]*[^\W_])?(?:\.[^\W_](?:[\w-]*[^\W_])?)*(?::\d{1,5})?(?:\/[^\s<]*)?/i.test(text)) {
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

		if (mode && false)
			text = `${fence}${mode}\n${text}\n${fence}`

		if (card)
			return

		createCard({
			id: 'new:create',
			position,
			content: text
		})
	}
}

/*
files.forEach(async (file, index) => {
    // TODO: upload file, create card
    // File inherits from Blob
    // eslint-disable-next-line no-console
    console.log(index, file.name, file.type, 'Size:', file.size)
  })

  if (files.length !== 0)
    return

  items.forEach(async (item, index) => {
    // TODO: create cards
    // eslint-disable-next-line no-console
    console.log(index, item.type, 'Size:', dataTransfer.getData(item.type).length)
  })
*/
