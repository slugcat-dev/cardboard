<script setup lang="ts">
const { loggedIn } = useUserSession()

watch(loggedIn, () => {
	if (!loggedIn.value)
		navigateTo('/signin')
})

useSeoMeta({
	title: 'Cardboard',
	description: 'Place virtual cards on a virtual canvas virtually anywhere',
	viewport: {
		width: 'device-width',
		initialScale: '1.0',
		userScalable: 'no'
	}
})
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
