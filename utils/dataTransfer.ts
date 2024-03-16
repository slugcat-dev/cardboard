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

	items.forEach(async (item) => {
		if (item.type === 'text/plain') {
			// The text will be pasted into the card immediately after it is focused
			// Bad idea, but I'll leave it this way for now
			createCard({
				id: 'new:empty',
				position
			})
		}
	})
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
