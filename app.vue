<script setup lang="ts">
const { loggedIn } = useUserSession()

watch(loggedIn, () => {
	if (!loggedIn.value)
		navigateTo('/signin')
})

useSeoMeta({
	title: 'Cardboard',
	description: 'Place virtual cards on a virtual canvas virtually anywhere',
	viewport: { userScalable: 'no' },
	themeColor: [
		{
			media: '(prefers-color-scheme: dark)',
			content: '#222222'
		},
		{
			media: '(prefers-color-scheme: light)',
			content: '#ffffff'
		}
	]
})

useHead({
	link: [{
		rel: 'manifest',
		href: 'manifest.json'
	}]
})
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
