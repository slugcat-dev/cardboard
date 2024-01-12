<script setup lang="ts">
const { board } = await useBoards()

definePageMeta({
	middleware: ['auth', 'breadcrumbs'],
	pageTransition: { name: 'slide' },
	layout: 'board'
})
useSeoMeta({ title: board.value.name })
</script>

<template>
	<BoardCanvas />
</template>
