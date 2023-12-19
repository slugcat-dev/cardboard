<template>
	<Canvas />
</template>

<script setup lang="ts">
import '~/assets/style.scss'

definePageMeta({
	middleware: 'auth'
})

useHead({
	title: useRoute().params.board.toString(),
	meta: [
		{
			name: 'theme-color',
			media: '(prefers-color-scheme: dark)',
			content: '#101010'
		},
		{
			name: 'theme-color',
			media: '(prefers-color-scheme: light)',
			content: '#f3f3f3'
		}
	],
	link: [
		{
			rel: 'manifest',
			href: 'manifest.json'
		},
		{
			rel: 'stylesheet',
			href: 'https://fonts.googleapis.com/css?family=Roboto:400,700;Ubuntu:400,700|JetBrains+Mono:400,700&display=swap'
		}
	]
})
</script>
