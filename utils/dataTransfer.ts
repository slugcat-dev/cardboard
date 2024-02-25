// TODO ---
const {	board } = await useBoards()

// Handle pasted and dropped data
export async function handleDataTransfer(dataTransfer: DataTransfer, position: Position) {
	const files = Array.from(dataTransfer.files)
	const items = Array.from(dataTransfer.items)

	for (const file of dataTransfer.files) {
		if (file.type.startsWith('image')) {
			board.value.cards.push(await fetchUpdateCard({
				id: 'create',
				type: 'image',
				position,
				content: await blobToBase64(file)
			}))
		}
	}

	if (dataTransfer.files.length > 0)
		return

	items.forEach(async (item) => {
		if (item.type === 'text/plain') {
			board.value.cards.push(await fetchUpdateCard({
				id: 'create',
				type: 'text',
				position,
				content: dataTransfer.getData('text/plain')
			}))
		}
	})
}

function blobToBase64(blob: Blob | null) {
	return new Promise((resolve: (result: string | null) => void) => {
		const reader = new FileReader()

		reader.onloadend = () => resolve(reader.result as string)

		if (blob)
			reader.readAsDataURL(blob)
		else
			resolve(null)
	})
}
// TODO ---
