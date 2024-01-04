<script setup lang="ts">
definePageMeta({
	middleware: 'auth'
})

useSeoMeta({
	// TODO: vueuse useRouteParams
	title: useRoute().params.board.toString()
})
</script>

<template>
	<div id="board">
		<BoardSidebar />
		<div class="board-main">
			<BoardHeader />
			<BoardCanvas />
		</div>
	</div>
</template>

<style>
body {
	overflow: hidden;
}

#board {
	display: flex;
	height: 100vh;

	.board-main {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}
}
</style>
