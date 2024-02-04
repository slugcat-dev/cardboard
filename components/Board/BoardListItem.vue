<script setup lang="ts">
defineProps(['board', 'indent'])

const { boards } = await useBoards()
</script>

<template>
	<NuxtLink
		class="board-link"
		:style="{ marginLeft: `${indent * 1.25}rem` }"
		:to="board.id"
		@keydown.f2="console.log('rename board')"
	>
		<IconCSS
			name="fluent:page-20-regular"
			size="20px"
		/>
		<IconCSS
			name="fluent:page-20-filled"
			size="20px"
		/>
		<span>
			{{ board.name }}
		</span>
	</NuxtLink>
	<BoardListItem
		v-for="b in boards.filter(i => i.parent === board.id)"
		:key="b.id"
		:board="b"
		:indent="indent + 1"
	/>
</template>
