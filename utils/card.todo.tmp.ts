const {	board } = await useBoards()

export async function updateCard(selection: any, card: any) {
	if (selection.cards.length !== 0)
		return await updateMany(selection)

	await $fetch(`/api/boards/${board.value.id}/cards/${card.id}`, {
		method: 'PUT',
		body: card
	})
}

export async function updateMany(selection: any) {
	await $fetch(`/api/boards/${board.value.id}/cards/many`, {
		method: 'PUT',
		body: selection.cards.map((card: Card) => ({ id: card.id, position: card.position }))
	})
}

export async function deleteCard(selection: any, cardRef: any, card: any) {
	if (selection.cards.length !== 0)
		return await deleteMany(selection)

	cardRef.value.classList.add('deleted')

	if (card.id !== 'create')
		await $fetch(`/api/boards/${board.value.id}/cards/${card.id}`, { method: 'DELETE' })

	setTimeout(() => board.value.cards.splice(board.value.cards.findIndex(c => c.id === card.id), 1), 200)
}

export async function deleteMany(selection: any) {
	// TODO: clear selection
	await $fetch(`/api/boards/${board.value.id}/cards/many`, {
		method: 'DELETE',
		body: selection.cards.map((card: Card) => {
			board.value.cards.splice(board.value.cards.findIndex(c => c.id === card.id), 1)

			return card.id
		})
	})
}
