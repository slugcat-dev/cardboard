<script setup lang="ts">
definePageMeta({
	middleware: 'auth'
})

useSeoMeta({
	title: useRoute().params.board.toString()
})
</script>

<template>
	<div>
		<BoardHeader />
		<BoardCanvas />
		<ContextMenu />
	</div>
</template>

<style>
body {
	overflow: hidden;
}
</style>
