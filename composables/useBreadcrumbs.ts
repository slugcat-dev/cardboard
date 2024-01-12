export const useBreadcrumbs = createGlobalState(async () => {
	const breadcrumbs = ref<Bread[]>([])
	const shift = ref<'up' | 'down' | false>(false)

	return {
		breadcrumbs,
		shift
	}
})
