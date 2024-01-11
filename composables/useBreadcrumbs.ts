export const useBreadcrumbs = createGlobalState(async () => {
	const breadcrumbs = ref([])
	const shift = ref()
	const unshift = ref()

	return {
		breadcrumbs,
		shift,
		unshift
	}
})
