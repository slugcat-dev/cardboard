<style>
body {
	width: 100vw;
	height: 100vh;
	margin: 0;
	padding: 0;
	font-family: Roboto, system-ui, sans-serif;
	line-height: 1.25em;
	color: var(--color-text);
	background-color: var(--color-background);
	-webkit-tap-highlight-color: transparent;
}

.page-leave-active,
.page-enter-active {
  transition: all .2s cubic-bezier(0,0,0,1);
}

.page-enter-from {
	opacity: 0;
	transform: translateY(2vh);
}

.page-leave-to {
	opacity: 0;
}
</style>

<template>
	<LoadingIndicator />
	<NuxtPage />
</template>

<script setup lang="ts">
import '~/assets/style.scss'

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
