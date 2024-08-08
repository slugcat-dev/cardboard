// TODO ---
// Handle pasted and dropped data
export async function handleDataTransfer(dataTransfer: DataTransfer, position: Position) {
	// const files = Array.from(dataTransfer.files)
	const items = Array.from(dataTransfer.items)

	for (const file of dataTransfer.files) {
		if (file.type.startsWith('image')) {
			createCard({
				id: 'new:create',
				type: 'image',
				position,
				content: await blobToBase64(file)
			})
		}
	}

	if (dataTransfer.files.length > 0)
		return

	let mode = null
	let text = null

	const tasks = items.map((item) => {
		return new Promise<void>((resolve) => {
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

	console.log(mode)

	if (text) {
		if (mode)
			text = `\`\`\`${mode}\n${text}\n\`\`\``

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
