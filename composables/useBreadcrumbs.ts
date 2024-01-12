export const useBreadcrumbs = createGlobalState(async () => {
	const breadcrumbs = ref<Breadcrumbs>({ bread: [], shift: false })

	return breadcrumbs
})
