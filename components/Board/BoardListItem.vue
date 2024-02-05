<script setup lang="ts">
defineProps(['board', 'indent'])

const { boards } = await useBoards()
</script>

<template>
	<NuxtLink
		class="board-link"
		:style="{ paddingLeft: `${(indent + .5)}rem` }"
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

<style lang="scss">
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

@media (pointer: coarse) {
	.board-link {
		padding: .5rem;
		font-size: 1rem;
	}
}
</style>
