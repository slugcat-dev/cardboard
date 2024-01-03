import { createSharedComposable } from '@vueuse/core'

export const useContextMenu = createSharedComposable(() => {
	const contextMenu = reactive({ options: undefined })

	function show(contextMenuOptions) {
		contextMenu.options = contextMenuOptions
	}

	return { contextMenu, show }
})
