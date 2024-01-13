export default defineNuxtRouteMiddleware(async (to, from) => {
	const { breadcrumbs, push } = await useBreadcrumbs()
	const { route } = await useBoardState()
	const { findBoard } = await useBoards()

	route.value = to

	if (!from.params.board)
		push.value = false

	const transitionName = (() => {
		if (push.value) {
			const fromBoard = findBoard(from.params.board as string)

			breadcrumbs.value.push({
				path: fromBoard.id,
				name: fromBoard.name
			})

			return 'drill'
		}

		const toBoardId = to.params.board
		const index = breadcrumbs.value.findIndex(bread => bread.path === toBoardId)

		if (index !== -1) {
			breadcrumbs.value.splice(index)

			return 'undrill'
		}

		breadcrumbs.value = []

		return 'slide'
	})()

	if (typeof to.meta.pageTransition === 'object')
		to.meta.pageTransition.name = transitionName

	push.value = false
})
