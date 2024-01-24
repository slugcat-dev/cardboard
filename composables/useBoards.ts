export const useBoardState = createGlobalState(async () => {
	const route = ref()
	const {
		data: boards,
		execute: fetchBoards
	} = useFetch<Board[]>('/api/boards', { method: 'GET' })

	await fetchBoards()

	return {
		route,
		boards,
		fetchBoards
	}
})

export async function useBoards() {
	const { route, boards, fetchBoards } = await useBoardState()
	const board = computed(() => findBoard(route.value.params.board))

	function findBoard(id: string) {
		const board = boards.value?.find(board => board.id === id)

		// TODO: this is pretty ugly.
		// route should never have board as undefined when navigating to a board
		return board || { id: '', name: '', owner: '', cards: [] }
	}

	async function createBoard(options: { open: boolean, parent?: string }) {
		const board = await $fetch<Board>(`/api/boards${boards.value?.length === 0 ? '/welcome' : ''}`, {
			method: 'POST',
			body: { parent: options.parent }
		})

		boards.value?.push(board)

		if (options.open)
			await navigateTo(`/${board.id}`)

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
