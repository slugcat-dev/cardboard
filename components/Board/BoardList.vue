<script setup lang="ts">
const { boards, createBoard } = await useBoards()
const rootBoards = computed(() => boards.value?.filter(board => !board.parent))
</script>

<template>
	<div class="boards">
		<div
			v-for="board of boards"
			:key="board.id"
			class="board"
			:style="{ opacity: rootBoards?.map(board => board.id).includes(board.id) ? 1 : .5 }"
		>
			<NuxtLink class="board-link" :to="board.id">
				<Icon
					name="fluent:page-20-regular"
					size="20px"
				/>
				{{ board.name }}
			</NuxtLink>
		</div>
		<Btn
			role="primary"
			style=" margin-top: 1rem; margin-left: 1rem;"
			icon="mdi:plus"
			@click="createBoard({ open: true })"
		>
			Create Board
		</Btn>
	</div>
</template>
