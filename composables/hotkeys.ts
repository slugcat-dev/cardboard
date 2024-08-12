export interface HotkeysConfig {
	[key: string]: (event: KeyboardEvent) => void
}

export function defineHotkeys(config: HotkeysConfig) {
	const hotkeys = Object.entries(config).map(([key, handler]) => {
		const keySplit = key.toLowerCase().split(' ')
		const hotkey = {
			handler,
			key: keySplit
				.filter(k => !['ctrl', 'meta', 'shift', 'alt'].includes(k))
				.map(k => k === 'space' ? ' ' : k)
				.join(),
			ctrlKey: keySplit.includes('ctrl'),
			metaKey: keySplit.includes('meta'),
			shiftKey: keySplit.includes('shift'),
			altKey: keySplit.includes('alt')
		}

		// Convert meta to ctrl for non-MacOS
		if (!isMacOS && hotkey.metaKey && !hotkey.ctrlKey) {
			hotkey.metaKey = false
			hotkey.ctrlKey = true
		}

		return hotkey
	})

	useEventListener('keydown', (event: KeyboardEvent) => {
		if (event.repeat || usingInput.value)
			return

		for (const hotkey of hotkeys) {
			if (
				event.key.toLowerCase() !== hotkey.key
				|| event.ctrlKey !== hotkey.ctrlKey
				|| event.metaKey !== hotkey.metaKey
				|| event.shiftKey !== hotkey.shiftKey
				|| event.altKey !== hotkey.altKey
			)
				continue

			event.preventDefault()
			hotkey.handler(event)
		}
	})
}
