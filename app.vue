<script setup lang="ts">
const { loggedIn } = useUserSession()

watch(loggedIn, () => {
	if (!loggedIn.value)
		navigateTo('/')
})

useSeoMeta({
	title: 'Cardboard',
	description: 'Place virtual cards on a virtual canvas virtually anywhere',
	charset: 'utf-8',
	viewport: {
		width: 'device-width',
		initialScale: '1.0',
		userScalable: 'no'
	},
	themeColor: [
		{
			media: '(prefers-color-scheme: dark)',
			content: '#101010'
		},
		{
			media: '(prefers-color-scheme: light)',
			content: '#f3f3f3'
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
	<LoadingIndicator />
	<NuxtPage />
</template>

<style>
body {
	width: 100vw;
	height: 100vh;
	margin: 0;
	padding: 0;
	color: var(--color-text);
	font-family: Roboto, system-ui, sans-serif;
	line-height: 1.25em;
	background-color: var(--color-background);
	-webkit-tap-highlight-color: transparent;
}

.page-leave-active,
.page-enter-active {
  transition: all .2s cubic-bezier(0, 0, 0, 1);
}

.page-enter-from {
	transform: translateY(2vh);
	opacity: 0;
}

.page-leave-to {
	opacity: 0;
}
</style>
