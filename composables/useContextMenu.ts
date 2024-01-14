export const useContextMenu = createGlobalState(() => {
	const contextMenu = ref<ContextMenuOptions>()

	function show(contextMenuOptions: ContextMenuOptions) {
		contextMenu.value = contextMenuOptions
	}

	return { contextMenu, show }
})
