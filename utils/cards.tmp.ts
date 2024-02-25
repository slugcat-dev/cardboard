const {	board } = await useBoards()

export async function fetchUpdateCard(card: Partial<Card>) {
	if (card.id === 'create') {
		delete card.id

		const { id } = await $fetch<Card>(`/api/boards/${board.value.id}/cards`, {
			method: 'POST',
			body: { card }
		})

		card.id = id

		return card as Card
	}

	return await $fetch<Card>(`/api/boards/${board.value.id}/cards/${card.id}`, {
		method: 'PUT',
		body: card
	})
}

export async function fetchUpdateMany(cards: Card[]) {
	await $fetch(`/api/boards/${board.value.id}/cards/many`, {
		method: 'PUT',
		body: cards.map(card => ({ id: card.id, position: card.position }))
	})
}

export async function fetchDeleteCard(card: Card) {
	board.value.cards.splice(board.value.cards.findIndex(c => c.id === card.id), 1)

	if (card.id !== 'create')
		await $fetch(`/api/boards/${board.value.id}/cards/${card.id}`, { method: 'DELETE' })
}

export async function fetchDeleteMany(cards: Card[]) {
	cards.forEach(card => board.value.cards.splice(board.value.cards.findIndex(c => c.id === card.id), 1))

	await $fetch(`/api/boards/${board.value.id}/cards/many`, {
		method: 'DELETE',
		body: cards.map(card => card.id)
	})
}
