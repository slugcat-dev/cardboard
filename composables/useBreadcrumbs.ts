export const useBreadcrumbs = createGlobalState(() => {
	const breadcrumbs = ref<Bread[]>([])
	const oldcrumbs = ref<Bread[]>([])
	const route = ref('')
	const push = ref(false)

	return {
		breadcrumbs,
		oldcrumbs,
		route,
		push
	}
})
