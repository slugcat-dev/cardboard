<script setup lang="ts">
const settings = useSettings()
const boardNameRef = ref()
const { board, deleteBoard } = await useBoards()
const { breadcrumbs, shift } = await useBreadcrumbs()

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

function navigateBack(id?: string) {
	shift.value = 'up'

	if (id)
		return navigateTo(`/${id}`)

	if (breadcrumbs.value.length === 0)
		return navigateTo('/boards')

	return navigateTo(`/${breadcrumbs.value.slice(-1)[0].path}`)
}

async function onDeleteBoard() {
	await deleteBoard(board.value.id)
	navigateBack()
}
</script>

<template>
	<header id="header">
		<div class="toolbar">
			<div class="breadcrumbs">
				<a
					class="bread nav-button"
					@click="navigateBack()"
				>
					<Icon name="mdi:chevron-left" size="1.5rem" />
				</a>
				<a
					class="bread nav-button"
					@click="navigateBack()"
				>
					<Icon name="mdi:chevron-right" size="1.5rem" />
				</a>
				<a
					v-for="bread in breadcrumbs"
					:key="bread.path"
					class="bread"
					@click="navigateBack(bread.path)"
				>{{ bread.name }}</a>
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
			<button @click="onDeleteBoard">
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

	.breadcrumbs {
		display: flex;
		align-items: center;
		font-weight: bold;

		.bread {
			color: var(--color-warn);
			text-decoration: none;

			&:not(.nav-button) {
				padding: 0 .25rem;
			}

			&:nth-child(2) {
				margin-right: .75rem;
				color: var(--color-text-secondary);
			}

			&:not(.nav-button)::after {
				margin-left: .5rem;
				overflow: hidden;
				color: var(--color-text-tertiary);
				content: '/';
			}
		}

		.board-name {
			padding: .125rem .25rem;

			&:focus-visible {
				border-radius: .25rem;
				outline: none;
				box-shadow: 0 0 0 2px var(--color-accent);
			}
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
