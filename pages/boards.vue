<script setup lang="ts">
// https://github.com/Atinux/nuxt-todos-edge/blob/main/pages/todos.vue

definePageMeta({
	middleware: 'auth'
})

const session = useUserSession()
const { user } = session
const { boards, createBoard } = await useBoards()

async function logout() {
	await session.clear()
}

async function onCreateBoard() {
	const newBoard = await createBoard()

	await navigateTo(`/${newBoard.id}`)
}
</script>

<template>
	<main>
		<div>
			<h1 class="welcome">
				<span style="font-weight: normal">Hello,</span>
				<img
					class="profile-picture"
					:src="user.picture"
				>
				{{ user.name }}
			</h1>
			<ul>
				<li
					v-for="board of boards"
					:key="board.id"
				>
					<NuxtLink :to="board.id">
						{{ board.name }}
					</NuxtLink>
				</li>
			</ul>
			<Btn
				role="primary"
				icon="mdi:plus"
				@click="onCreateBoard"
			>
				Create Board
			</Btn>
			<Btn
				role="danger"
				icon="mdi:logout"
				@click="logout"
			>
				Log Out
			</Btn>
			<div class="text-secondary">
				User ID: {{ user.id }}
			</div>
		</div>
	</main>
</template>

<style>
main {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
}

.welcome {
	display: flex;
	gap: .5ch;
	align-items: center;
	font-size: 2.5rem;
}

.profile-picture {
	width: 1em;
	height: 1em;
	background-color: var(--color-background-secondary);
	border-radius: 100%;
}
</style>
