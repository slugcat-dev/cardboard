export const useKeys = createSharedComposable(() => {
	const macOS = process.client && navigator.userAgent.includes('Macintosh')
	const metaKey = ref(false)
	const shiftKey = ref(false)

	useEventListener('keydown', keyEventHandler)
	useEventListener('keyup', keyEventHandler)
	useEventListener('pointerdown', keyEventHandler)
	useEventListener('wheel', keyEventHandler)

	function keyEventHandler(event: KeyboardEvent | PointerEvent | WheelEvent) {
		metaKey.value = macOS ? event.metaKey : event.ctrlKey
		shiftKey.value = event.shiftKey
	}

	return {
		macOS,
		metaKey,
		shiftKey
	}
})
