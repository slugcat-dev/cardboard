export const useBreadcrumbs = createGlobalState(async () => {
	const breadcrumbs = ref<Bread[]>([])
	const push = ref(false)

	return {
		breadcrumbs,
		push
	}
})
