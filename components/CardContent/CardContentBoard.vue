<script setup lang="ts">
const { card } = defineProps(['card'])

const { data } = await useFetch(`/api/boards/${card.content}`, { method: 'GET' })
const board = data.value as Board
</script>

<template>
	<NuxtLink :to="card.content">
		{{ board.name || 'loading' }}
	</NuxtLink>
</template>
