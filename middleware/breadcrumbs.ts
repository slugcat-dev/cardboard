export default defineNuxtRouteMiddleware(async (to, from) => {
	const { breadcrumbs, shift } = await useBreadcrumbs()
	const { route } = await useBoardState()
	const { findBoard } = await useBoards()

	route.value = to

	if (!from.params.board)
		shift.value = false

	const transitionName = (() => {
		switch (shift.value) {
			case 'down': {
				const fromBoard = findBoard(from.params.board as string)

				breadcrumbs.value.push({
					path: fromBoard.id,
					name: fromBoard.name
				})

				return 'drill'
			}

			case 'up': {
				const toBoardId = to.params.board
				const index = breadcrumbs.value.findIndex(bread => bread.path === toBoardId)

				breadcrumbs.value.splice(index)

				return 'undrill'
			}

			default: {
				breadcrumbs.value = []

				return 'slide'
			}
		}
	})()

	if (typeof to.meta.pageTransition === 'object')
		to.meta.pageTransition.name = transitionName

	shift.value = false
})
