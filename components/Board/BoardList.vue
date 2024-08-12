<script setup lang="ts">
const { boards, createBoard } = await useBoards()
const rootBoards = computed(() => boards.value.filter(board => !board.parent))
const favRootBoards = computed(() => rootBoards.value.filter(board => board.fav))
const noFavRootBoards = computed(() => rootBoards.value.filter(board => !board.fav))
</script>

<template>
	<div class="boards">
		<div
			v-if="favRootBoards.length !== 0"
			:style="{ marginBottom: noFavRootBoards.length === 0 ? 0 : '.875rem' }"
		>
			<div class="section-title text-secondary">
				Favourites
			</div>
			<BoardListItem
				v-for="b in favRootBoards"
				:key="b.id"
				:board="b"
				:indent="0"
			/>
		</div>
		<div v-if="noFavRootBoards.length !== 0">
			<div class="section-title text-secondary">
				Your Boards
			</div>
			<BoardListItem
				v-for="b in noFavRootBoards"
				:key="b.id"
				:board="b"
				:indent="0"
			/>
		</div>
		<div
			class="board-link"
			@click="createBoard({ open: true })"
		>
			<ClientIcon
				name="lucide:plus"
				size="20px"
			/>
			<div />
			<span>Create Board</span>
		</div>
	</div>
</template>

<style>
.boards {
	display: flex;
	flex-direction: column;

	.section-title {
		padding-left: .5rem;
		font-weight: bold;
		opacity: .75;
	}
}
</style>
