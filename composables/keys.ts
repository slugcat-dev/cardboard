export const useKeys = createSharedComposable(() => {
	const macOS = process.client && navigator.userAgent.includes('Macintosh')
	const metaKey = ref(false)
	const shiftKey = ref(false)

	useEventListener('keydown', keyboardEventHandler)
	useEventListener('keyup', keyboardEventHandler)

	function keyboardEventHandler(event: KeyboardEvent | MouseEvent) {
		metaKey.value = macOS ? event.metaKey : event.ctrlKey
		shiftKey.value = event.shiftKey
	}

	return {
		macOS,
		metaKey,
		shiftKey
	}
})
