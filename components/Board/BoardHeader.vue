<script setup lang="ts">
const router = useRouter()
const settings = useSettings()
const boardNameRef = ref()
const { board, deleteBoard } = await useBoards()
const { breadcrumbs, oldcrumbs } = await useBreadcrumbs()

defineShortcuts({
	escape: () => {
		if (breadcrumbs.value.length === 0)
			return

		router.back()
	}
})

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

async function onDeleteBoard() {
	await deleteBoard(board.value.id)
	router.back()
}
</script>

<template>
	<header id="header">
		<div class="toolbar">
			<div class="breadcrumbs">
				<a
					class="nav-button"
					@click="router.back()"
				>
					<Icon name="material-symbols:arrow-back-ios-rounded" size="1rem" />
				</a>
				<a
					class="nav-button"
					:class="{ disabled: oldcrumbs.length === 0 }"
					@click="router.forward()"
				>
					<Icon name="material-symbols:arrow-forward-ios-rounded" size="1rem" />
				</a>
				<span class="bread-separator">/</span>
				<div
					v-for="bread, index in breadcrumbs"
					:key="bread.path"
					class="bread"
				>
					<a @click="router.go(-(breadcrumbs.length - index))">{{ bread.name }}</a>
					<span class="bread-separator">/</span>
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
				<span class="bread-separator">/</span>
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
	box-shadow: 0 2px 4px var(--color-shadow-ui);
  clip-path: inset(0 0 -6px 0);
	user-select: none;

	.breadcrumbs {
		display: flex;
		align-items: center;
		font-weight: bold;

		.nav-button {
			display: flex;
			align-items: center;
			margin-right: .5rem;
			color: var(--color-text);
			transition: color .1s;

			&:nth-child(2) {
				margin-right: .75rem;
			}

			&.disabled {
				color: var(--color-text-tertiary);
			}
		}

		.bread-separator {
			margin: 0 .25rem;
			overflow: hidden;
			color: var(--color-text-tertiary);
			content: '/';
		}

		.bread {
			display: flex;
			align-items: center;

			a {
				padding: .125rem .25rem;
				color: var(--color-warn);
				text-decoration: none;
				border-radius: .25rem;
				transition: background-color .1s;

				&:hover {
					background-color: var(--color-warn-25);
				}
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
