<script setup lang="ts">
const router = useRouter()
const settings = useSettings()
const boardNameRef = ref()
const { board, deleteBoard } = await useBoards()

useSeoMeta({ title: () => board.value.name })
defineHotkeys({
	f2: () => {
		const range = document.createRange()
		const textNode = boardNameRef.value.childNodes[0]

		range.setStart(textNode, 0)
		range.setEnd(textNode, textNode.textContent.length - 1)
		selectRange(range)
		boardNameRef.value.focus()
	}
})

function onBoardNameUpdate() {
	window.getSelection()?.removeAllRanges()

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

function toggleBoardFav() {
	board.value.fav = !board.value.fav

	$fetch(`/api/boards/${board.value.id}`, {
		method: 'PUT',
		body: { fav: board.value.fav }
	})
}

async function onDeleteBoard() {
	if (await deleteBoard(board.value.id))
		router.back()
}

async function makeBoard() {
	return alert('No')
}
</script>

<template>
	<header id="header">
		<ButtonIcon
			icon="f7:sidebar-left"
			@click="settings.sidebar = !settings.sidebar"
		/>
		<div
			v-if="board.id"
			class="toolbar"
		>
			<div class="nav">
				<a
					class="nav-button"
					@click="router.back()"
				>
					<Icon
						name="material-symbols:arrow-back-ios-rounded"
						size="14px"
					/>
				</a>
				<a
					class="nav-button"
					@click="router.forward()"
				>
					<Icon
						name="material-symbols:arrow-forward-ios-rounded"
						size="14px"
					/>
				</a>
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
			<ButtonIcon
				v-if="!board.parent"
				:icon="board.fav ? 'mdi:star' : 'mdi:star-outline'"
				@click="toggleBoardFav"
			/>
			<ButtonIcon
				style="margin-left: auto;"
				@click="onDeleteBoard"
			>
				Delete Board
			</ButtonIcon>
		</div>
		<div
			v-else
			class="header-title"
			@click="makeBoard()"
		>
			<Icon
				name="material-symbols:search"
				size="16px"
			/>
			Cardboard<kbd>⌘</kbd><kbd>K</kbd>
		</div>
	</header>
</template>

<style>
.outbox {
	display: none !important;
}

.header-title {
	width: 50%;
	max-width: 480px;
	min-width: 240px;
	margin: auto;
	display: flex;
	grid-area: header;
	gap: .25rem;
	align-items: center;
	justify-content: center;
	padding: .125rem;
	font-weight: bold;
	font-size: .875rem;
	line-height: 18px;
	text-align: center;
	background-color: var(--color-background-tertiary);
	border: 1px solid var(--color-scrollbar);
	border-radius: .375rem;

	.icon {
		opacity: .635;
	}

	kbd {
		display: none;
		padding: 0 .25rem;
		background-color: #666;
		border-radius: .25rem;
		box-shadow: 0 -2px 0 0 #444 inset;
		opacity: .635;
	}
}

#header {
	position: fixed;
	width: calc(100% - 240px);
	left: 240px;
	display: flex;
	gap: 1rem;
	align-items: center;
	padding: .5rem 1rem;
	background-color: var(--color-background);
	transition: left .2s;
	user-select: none;
	z-index: 5;

	.nav {
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

		.board-name {
			padding: .125rem .25rem;

			&:focus-visible {
				border-radius: .25rem;
				outline: none;
				outline: 2px solid var(--color-accent);
			}
		}
	}

	.toolbar {
		display: flex;
		width: 100%;
		gap: 1rem;
		align-items: center;
		font-weight: 500;
		font-size: .875rem;

		.toolbox {
			display: flex;

			.tool {
				padding: .25rem;
				text-decoration: none;
				border-radius: .25rem;

				&:hover {
					background-color: var(--color-accent-25);
				}

				&.active {
					color: var(--color-accent);
				}

				.icon {
					display: block;
				}
			}
		}

	}
}

#sidebar.hidden ~ #header {
	left: 0;
}
</style>
