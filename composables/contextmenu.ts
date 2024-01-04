export const useContextMenu = createSharedComposable(() => {
	const contextMenu = reactive({ options: undefined })

	function show(contextMenuOptions) {
		contextMenu.options = contextMenuOptions
	}

	return { contextMenu, show }
})
