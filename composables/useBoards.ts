const boardState = createGlobalState(async () => {
	const {
		data: boards,
		execute: fetchBoards
	} = useFetch<Board[]>('/api/boards', { method: 'GET' })

	await fetchBoards()

	return ref<Board[]>(boards.value ?? [])
})

export async function useBoards() {
	const { params } = useRoute()
	const boards = await boardState()
	const board = findBoard(params.board)

	function findBoard(id: string) {
		// TODO: handle board not found
		return boards.value.find(board => board.id === id)
	}

	async function createBoard() {
		const board = await $fetch<Board>('/api/boards', { method: 'POST' })

		boards.value.push(board)

		return board
	}

	async function deleteBoard(id: string) {
		// eslint-disable-next-line no-alert
		if (!confirm('Do you REALLY want to delete this board?'))
			return

		await $fetch(`/api/boards/${id}`, { method: 'DELETE' })

		boards.value = boards.value.filter(board => board.id !== id) ?? []
	}

	return {
		boards,
		board,
		findBoard,
		createBoard,
		deleteBoard
	}
}
