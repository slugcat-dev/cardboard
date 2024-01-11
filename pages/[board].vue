<script setup lang="ts">
const { board } = await useBoards()

definePageMeta({
	middleware: ['auth', 'breadcrumbs'],
	pageTransition: { name: 'slide' },
	layout: 'board'
})
useSeoMeta({
	// TODO: vueuse useRouteParams
	title: board.value.name
})
</script>

<template>
	<BoardCanvas />
</template>
