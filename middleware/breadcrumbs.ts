export default defineNuxtRouteMiddleware(async (to, from) => {
	const breadcrumbs = await useBreadcrumbs()
	const { route } = await useBoardState()
	const { findBoard } = await useBoards()

	route.value = to

	if (!from.params.board)
		breadcrumbs.value.shift = false

	const transitionName = (() => {
		switch (breadcrumbs.value.shift) {
			case 'down': {
				const fromBoard = findBoard(from.params.board as string)

				breadcrumbs.value.bread.push({
					path: fromBoard.id,
					name: fromBoard.name
				})

				return 'drill'
			}

			case 'up': {
				const toBoardId = to.params.board
				const index = breadcrumbs.value.bread.findIndex(bread => bread.path === toBoardId)

				breadcrumbs.value.bread.splice(index)

				return 'undrill'
			}

			default: {
				breadcrumbs.value.bread = []

				return 'slide'
			}
		}
	})()

	if (typeof to.meta.pageTransition === 'object')
		to.meta.pageTransition.name = transitionName

	breadcrumbs.value.shift = false
})
