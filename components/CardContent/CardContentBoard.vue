<script setup lang="ts">
const { card } = defineProps(['card'])
const { findBoard } = await useBoards()
const board = findBoard(card.content)
</script>

<template>
	<div class="card-board">
		<h2>{{ board.name }}</h2>
		<NuxtLink :to="card.content">
			Go To
		</NuxtLink>
	</div>
</template>

<style lang="scss">
.card-board {
	padding: .5rem;

	h2 {
		margin: 0;
		margin-bottom: .25rem;
		font-size: 1.125rem;
	}
}
</style>
