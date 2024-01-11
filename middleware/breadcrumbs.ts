export default defineNuxtRouteMiddleware(async (to, from) => {
	const { breadcrumbs, shift, unshift } = await useBreadcrumbs()
	const { findBoard } = await useBoards()

	if (typeof to.meta.pageTransition === 'object') {
		if (shift.value)
			to.meta.pageTransition.name = 'drill'
		else if (unshift.value)
			to.meta.pageTransition.name = 'undrill'
		else to.meta.pageTransition.name = 'slide'
	}

	if (shift.value) {
		breadcrumbs.value.push(findBoard(from.params.board))

		shift.value = false
	}
	else if (unshift.value) {
		breadcrumbs.value.pop()

		unshift.value = false
	}
	else breadcrumbs.value = []
})
