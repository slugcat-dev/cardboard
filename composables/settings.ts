// TODO: nuxt-ui useColorMode
// TODO: vuseuse useStorage
export const useSettings = createSharedComposable(() => {
	const settings = reactive({
		grid: {
			snap: true,
			show: false,
			size: 20
		}
	})
	const savedSettings = getSettings()

	if (savedSettings)
		Object.assign(settings, savedSettings)

	watch(settings, value => saveSettings(value), { deep: true })

	function getSettings() {
		if (process.server)
			return null

		const value = localStorage.getItem('settings')

		return value ? JSON.parse(value) : null
	}

	function saveSettings(value: any) {
		localStorage.setItem('settings', JSON.stringify(value))
	}

	return settings
})
