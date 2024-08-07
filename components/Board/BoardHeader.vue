<script setup lang="ts">
const router = useRouter()
const settings = useSettings()
const boardNameRef = ref()
const { board, deleteBoard } = await useBoards()
const { breadcrumbs, oldcrumbs } = useBreadcrumbs()

useSeoMeta({ title: () => board.value.name })
defineHotkeys({
	escape: () => {
		if (breadcrumbs.value.length === 0)
			return

		router.back()
	},
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

// const isDark = useDark({ storageKey: 'color-scheme' })
// const toggleDark = useToggle(isDark)
</script>

<template>
	<header id="header">
		<button
			class="sidebar-toggle"
			@click="settings.sidebar = !settings.sidebar"
		>
			<ClientIcon name="f7:sidebar-left" size="1rem" />
		</button>
		<div
			v-if="board.id"
			class="toolbar"
		>
			<div class="breadcrumbs">
				<a
					class="nav-button"
					@click="router.back()"
				>
					<ClientIcon name="material-symbols:arrow-back-ios-rounded" size="14px" />
				</a>
				<a
					class="nav-button"
					:class="{ disabled: oldcrumbs.length === 0 }"
					@click="router.forward()"
				>
					<ClientIcon name="material-symbols:arrow-forward-ios-rounded" size="14px" />
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
			<label class="option" style="text-decoration: line-through;">
				<input
					type="checkbox"
					:checked="settings.grid.snap"
					@change="(event) => settings.grid.snap = (event.target as HTMLInputElement).checked"
				>
				Snap cards to grid
			</label>
			<button @click="onDeleteBoard">
				Delete Board
			</button>
			<button
				v-if="!board.parent"
				@click="toggleBoardFav"
			>
				<ClientIcon :name="board.fav ? 'mdi:star' : 'mdi:star-outline'" size="1rem" />
			</button>
			<button
				@click="makeBoard"
			>
				<ClientIcon name="lucide:plus" size="1rem" />
				Create Board
			</button>
			<div
				v-if="false"
				class="toolbox"
			>
				<div class="tool active">
					<ClientIcon
						name="material-symbols:text-fields"
						size="1rem"
					/>
				</div>
				<div class="tool">
					<ClientIcon
						name="material-symbols:dashboard"
						size="1rem"
					/>
				</div>
				<div class="tool">
					<ClientIcon
						name="material-symbols:checklist"
						size="1rem"
					/>
				</div>
			</div>
		</div>
		<div
			v-else
			class="header-title"
		>
			<ClientIcon name="material-symbols:search" size="16px" />
			Cardboard<kbd>⌘</kbd><kbd>K</kbd>
		</div>
	</header>
</template>

<style lang="scss">
.header-title {
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
	left: 240px;
	display: flex;
	gap: 1rem;
	align-items: center;
	padding: .5rem 1rem;
	background-color: var(--color-background);
	transition: left .2s;
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
				color: var(--color-accent);
				text-decoration: none;
				border-radius: .25rem;
				transition: background-color .1s;

				&:hover {
					background-color: var(--color-accent-25);
				}
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
