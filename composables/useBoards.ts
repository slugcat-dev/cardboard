export async function useBoards() {
	const boards = useState<Board[]>('boards')

	async function fetchBoards() {
		const { data } = await useFetch<Board[]>('/api/boards', { method: 'GET' })

		boards.value = data.value ?? []
	}

	await callOnce(fetchBoards)

	const board = computed(() => findBoard(useRoute().params.board as string))

	// Fetch board cards
	if (!board.value.cards) {
		const { data } = import.meta.server
			? await useFetch<{ cards: Card[] }>(`/api/boards/${board.value.id}`, { method: 'GET', pick: ['cards'] })
			: { data: { value: await $fetch<{ cards: Card[] }>(`/api/boards/${board.value.id}`, { method: 'GET' }) } }

		board.value.cards = data.value?.cards || []
	}

	function findBoard(id: string) {
		return boards.value.find(board => board.id === id) || { id: '', name: '', owner: '', parent: '', cards: [], createdAt: new Date() }
	}

	async function createBoard(options: { open: boolean, parent?: string }) {
		const board = await $fetch<Board>(`/api/boards${boards.value?.length === 0 ? '/welcome' : ''}`, {
			method: 'POST',
			body: { parent: options.parent }
		})

		boards.value.push(board)

		if (options.open)
			await navigateTo(`/${board.id}`)

		return board
	}

	async function deleteBoard(id: string) {
		if (!confirm('Do you REALLY want to DELETE THIS BOARD AND ALL THE BOARDS it contains? This action is irreversible!'))
			return false

		await $fetch(`/api/boards/${id}`, { method: 'DELETE' })
		await fetchBoards()

		return true
	}

	return {
		boards,
		board,
		findBoard,
		createBoard,
		deleteBoard
	}
}
