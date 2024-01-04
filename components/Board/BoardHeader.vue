<script setup lang="ts">
const route = useRoute()
const settings = useSettings()
const boardNameRef = ref()
const { data } = await useFetch(`/api/boards/${route.params.board}`, { method: 'GET' })
const board = data.value as Board
const session = useUserSession()
const { user } = session

function onBoardNameUpdate() {
	const name = boardNameRef.value.textContent

	if (name.length === 0) {
		boardNameRef.value.textContent = board.name

		return
	}

	board.name = name

	$fetch(`/api/boards/${board.id}`, {
		method: 'PUT',
		body: board
	})
}

async function deleteBoard() {
	// eslint-disable-next-line no-alert
	if (!confirm('Do you REALLY want to delete this board?'))
		return

	await useFetch(`/api/boards/${route.params.board}`, { method: 'DELETE' })

	navigateTo('/boards')
}
</script>

<template>
	<header id="header">
		<div class="toolbar allow-pointer-events">
			<NuxtLink to="/boards">
				<Icon name="mdi:chevron-left" size="1.5rem" />
			</NuxtLink>
			<span>Workspace</span>
			<span style="opacity: .5;">/</span>
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
			<button @click="deleteBoard">
				Delete Board
			</button>
		</div>
		<div
			class="profile allow-pointer-events"
			@click="session.clear()"
		>
			<img
				class="profile-picture"
				:src="user.picture"
				draggable="false"
			>
			{{ user.name }}
		</div>
	</header>
</template>

<style lang="scss">
#header {
	display: flex;
	position: fixed;
	top: 0;
	left: 0;
	width: calc(100vw - .5rem);
	margin: .25rem;
	padding: .5rem 1rem;
	justify-content: space-between;
	align-items: flex-start;
	background-color: var(--color-background-secondary);
	border: 1px solid var(--color-border);
	border-radius: .5rem;
	box-shadow: var(--shadow-card);
	z-index: 10;
	user-select: none;
	pointer-events: none;

	.board-name {
		margin-left: -.25rem;
		padding: .125rem .25rem;

		&:focus-visible {
			border-radius: .25rem;
			box-shadow: 0 0 0 2px var(--color-accent);
			outline: none;
		}

		&:hover:not(:focus-visible) {
			text-decoration: underline;
		}
	}

	.toolbar {
		display: flex;
		gap: 1rem;
		align-items: center;
		font-size: .875rem;
		font-weight: 500;

		.option,
		.option > input[type="checkbox"] {
			cursor: pointer;
		}
	}

	.profile {
		display: flex;
		align-items: center;
		gap: .5rem;
		font-weight: bold;
		cursor: pointer;

		.profile-picture {
			width: 1.5rem;
			height: 1.5rem;
			background-color: var(--color-scrollbar);
			border-radius: 100%;
		}
	}
}
</style>
