<script setup lang="ts">
const { card } = defineProps(['card'])
const { findBoard } = await useBoards()
const board = findBoard(card.content)
</script>

<template>
	<NuxtLink :to="card.content">
		{{ board.name || 'loading' }}
	</NuxtLink>
</template>
