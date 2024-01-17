export function useSettings() {
	const settings = useLocalStorage('settings', {
		sidebar: true,
		grid: {
			snap: true,
			size: 20
		}
	}, { mergeDefaults: true, initOnMounted: true })

	return settings
}
