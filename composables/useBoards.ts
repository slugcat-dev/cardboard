export async function useBoards() {
	const boards = useState<Board[]>('boards')

	async function fetchBoards() {
		const { data } = await useFetch<Board[]>('/api/boards', { method: 'GET' })

		boards.value = data.value ?? []
	}

	await callOnce(fetchBoards)

	// ! const route = useRoute()
	const board = computed(() => findBoard(useBreadcrumbs().route.value))

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
		// eslint-disable-next-line no-alert
		if (!confirm('Do you REALLY want to delete this board?'))
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
