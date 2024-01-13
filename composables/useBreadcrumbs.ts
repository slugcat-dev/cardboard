export const useBreadcrumbs = createGlobalState(async () => {
	const breadcrumbs = ref<Bread[]>([])
	const oldcrumbs = ref<Bread[]>([])
	const push = ref(false)

	return {
		breadcrumbs,
		oldcrumbs,
		push
	}
})
