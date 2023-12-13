// https://github.com/nuxt/ui/blob/dev/src/runtime/composables/useShortcuts.ts
import { useActiveElement } from '@vueuse/core'

export function useShortcuts() {
	const macOS = process.client && navigator.userAgent.includes('Macintosh')
	const metaSymbol = macOS ? '⌘' : 'Ctrl'
	const usingInput = computed(() => {
		const activeElement = useActiveElement()

		return !!(activeElement.value?.tagName === 'INPUT' || activeElement.value?.tagName === 'TEXTAREA' || activeElement.value?.contentEditable === 'true')
	})

	return {
		macOS,
		metaSymbol,
		usingInput
	}
}
