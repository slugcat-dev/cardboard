<script setup lang="ts">
const settings = useSettings()
const boardNameRef = ref()
const { board, deleteBoard } = await useBoards()
const breadcrumbs = await useBreadcrumbs()

function onBoardNameUpdate() {
	const name = boardNameRef.value.textContent

	if (name.length === 0) {
		boardNameRef.value.textContent = board.value.name

		return
	}

	board.value.name = name

	$fetch(`/api/boards/${board.value.id}`, {
		method: 'PUT',
		body: { name }
	})
}

function onNavigate(id?: string) {
	breadcrumbs.value.shift = 'up'

	if (id)
		return navigateTo(`/${id}`)

	if (breadcrumbs.value.bread.length === 0)
		return navigateTo('/boards')

	return navigateTo(`/${breadcrumbs.value.bread[breadcrumbs.value.bread.length - 1].path}`)
}
</script>

<template>
	<header id="header">
		<div class="toolbar">
			<a @click="onNavigate()">
				<Icon name="mdi:chevron-left" size="1.5rem" />
			</a>
			<div style="display: flex;">
				<div
					v-for="bread in breadcrumbs.bread"
					:key="bread.path"
				>
					<a @click="onNavigate(bread.path)">{{ bread.name }}</a>
					<span style="opacity: .5;">/</span>
				</div>
				<div
					ref="boardNameRef"
					class="board-name"
					contenteditable="plaintext-only"
					@blur="onBoardNameUpdate"
					@keydown.enter="boardNameRef.blur"
					@keydown.escape="boardNameRef.blur"
				>
					{{ board.name }}
				</div>
			</div>
			<ClientOnly>
				<label class="option">
					<input
						type="checkbox"
						:checked="settings.grid.snap"
						@change="settings.grid.snap = ($event.target as HTMLInputElement).checked"
					>
					Snap cards to grid
				</label>
				<label class="option">
					<input
						type="checkbox"
						:checked="settings.grid.show"
						@change="settings.grid.show = ($event.target as HTMLInputElement).checked"
					>
					Show grid
				</label>
			</ClientOnly>
			<button @click="deleteBoard(board.id)">
				Delete Board
			</button>
		</div>
	</header>
</template>

<style lang="scss">
#header {
	z-index: 15;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	padding: .5rem 1rem;
	background-color: var(--color-background-secondary);
	border-bottom: 1px solid var(--color-border);
	box-shadow: 0 2px 4px #00000040;
  clip-path: inset(0 0 -6px 0);
	user-select: none;

	.board-name {
		&:focus-visible {
			border-radius: .25rem;
			outline: none;
			box-shadow: 0 0 0 2px var(--color-accent);
		}

		&:hover:not(:focus-visible) {
			text-decoration: underline;
		}
	}

	.toolbar {
		display: flex;
		gap: 1rem;
		align-items: center;
		font-weight: 500;
		font-size: .875rem;

		.option,
		.option > input[type="checkbox"] {
			cursor: pointer;
		}
	}
}
</style>
