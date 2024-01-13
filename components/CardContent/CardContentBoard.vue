<script setup lang="ts">
const { card } = defineProps(['card'])
const { findBoard } = await useBoards()
const board = findBoard(card.content)
const previewCards = board.cards.filter(card => card.position.x < 1920 && card.position.y < 1080)

async function onNavigate() {
	const { push } = await useBreadcrumbs()

	push.value = true

	return navigateTo(`/${card.content}`)
}
</script>

<template>
	<div class="card-board">
		<a @click="onNavigate">
			{{ board.name }}
		</a>
		<img src="~/assets/images/miniboard.png">
	</div>
</template>

<style lang="scss">
.card-board {
	a {
		display: block;
		margin: 0;
		padding: .5rem;
		font-size: 1.125rem;
	}

	img {
		display: block;
		width: 200px;
		border-radius: 0 0 .25rem .25rem;
		filter: brightness(1.5);
	}
}
</style>
