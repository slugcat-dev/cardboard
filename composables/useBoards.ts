export const useBoardState = createGlobalState(async () => {
	const {
		data: boards,
		execute: fetchBoards
	} = useFetch<Board[]>('/api/boards', { method: 'GET' })

	await fetchBoards()

	return {
		boards,
		fetchBoards
	}
})

export async function useBoards() {
	const params = toRef(useRoute(), 'params')
	const { boards, fetchBoards } = await useBoardState()
	const board = computed(() => findBoard(params.value.board as string))

	function findBoard(id: string) {
		const board = boards.value?.find(board => board.id === id)

		// TODO: this is pretty ugly.
		// route should never have board as undefined when navigating to a board
		return board || { id: '', name: '', owner: '', cards: [] }
	}

	async function createBoard() {
		const board = await $fetch<Board>('/api/boards', { method: 'POST' })

		boards.value?.push(board)

		return board
	}

	async function deleteBoard(id: string) {
		// eslint-disable-next-line no-alert
		if (!confirm('Do you REALLY want to delete this board?'))
			return

		await $fetch(`/api/boards/${id}`, { method: 'DELETE' })
		await fetchBoards()
	}

	return {
		boards,
		board,
		findBoard,
		createBoard,
		deleteBoard
	}
}
