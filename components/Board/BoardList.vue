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
			class="favs"
			:style="{ marginBottom: noFavRootBoards.length === 0 ? 0 : '1rem' }"
		>
			<div class="section text-secondary">
				Favourites
			</div>
			<BoardListItem
				v-for="b in favRootBoards"
				:key="b.id"
				:board="b"
				:indent="0"
			/>
		</div>
		<div
			v-if="noFavRootBoards.length !== 0"
			class="nofavs"
		>
			<div class="section text-secondary">
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
			<IconCSS
				name="mdi:plus"
				size="20px"
			/>
			<div />
			<span>Create Board</span>
		</div>
	</div>
</template>

<style lang="scss">
.boards {
	display: flex;
	flex-direction: column;
	overflow-y: scroll;

	.section {
		padding-left: .5rem;
		font-weight: bold;
		opacity: .5;
	}

	&::-webkit-scrollbar {
		width: 0;
		height: 0;
	}
}

.board-link {
	display: block;
	padding: .25rem .5rem;
	overflow: hidden;
	color: currentcolor;
	font-size: .875rem;
	white-space: nowrap;
	text-overflow: ellipsis;
	border-radius: .375rem;

	span {
		vertical-align: middle;
	}

	span:last-child {
		margin-left: .25rem;
	}

	&:hover {
		text-decoration: none;
		background-color: #8882;
	}

	:nth-child(2) {
		display: none;
	}

	&.router-link-active {
		background-color: #8884;
		box-shadow: 0 0 0 1px oklch(40% 0 0deg / 30%) inset;

		:first-child {
			display: none;
		}

		:nth-child(2) {
			display: inline-block;
		}
	}

	&:not(.router-link-active) {
		color: var(--color-text-tertiary);
	}
}
</style>
