/* export default defineNuxtRouteMiddleware(async (to, from) => {
	const { breadcrumbs, oldcrumbs, route, push } = useBreadcrumbs()
	const { findBoard } = await useBoards()

	route.value = to.params.board as string

	if (!from.params.board)
		push.value = false

	const transitionName = await (async () => {
		const fromBoard = await findBoard(from.params.board as string)
		const toBoardId = to.params.board
		const breadIndex = breadcrumbs.value.findIndex(bread => bread.path === toBoardId)

		// If explicity set, push state and go down
		if (push.value) {
			breadcrumbs.value.push({
				path: fromBoard.id,
				name: fromBoard.name
			})

			oldcrumbs.value = []

			return 'drill'
		}

		// Go back
		if (breadIndex !== -1) {
			const leftover = [...breadcrumbs.value.splice(breadIndex)]

			leftover.splice(0, 1)
			leftover.push({
				path: fromBoard.id,
				name: fromBoard.name
			})
			oldcrumbs.value.unshift(...leftover)

			return 'undrill'
		}

		// Go forward
		if (oldcrumbs.value.length !== 0 && oldcrumbs.value[0].path === toBoardId) {
			breadcrumbs.value.push({
				path: fromBoard.id,
				name: fromBoard.name
			})
			oldcrumbs.value.shift()

			return 'drill'
		}

		breadcrumbs.value = []
		oldcrumbs.value = []

		return 'slide'
	})()

	if (typeof to.meta.pageTransition === 'object')
		to.meta.pageTransition.name = transitionName

	push.value = false
})
*/
