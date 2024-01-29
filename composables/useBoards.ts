export async function useBoards() {
	const boards = useState<Board[]>('boards')

	await callOnce(async () => {
		const { data } = await useFetch<Board[]>('/api/boards', { method: 'GET' })

		boards.value = data.value ?? []
	})

	// ! const route = useRoute()
	const board = computed(() => findBoard(useBreadcrumbs().route.value))

	function findBoard(id: string) {
		return boards.value.find(board => board.id === id) || { id: '', name: '', owner: '', parent: '', cards: [] }
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
		// eslint-disable-next-line no-alert
		if (!confirm('Do you REALLY want to delete this board?'))
			return false

		await $fetch(`/api/boards/${id}`, { method: 'DELETE' })
		boards.value.splice(boards.value.findIndex(board => board.id === id), 1)

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
