<style>
main {
	display: flex;
	height: 100vh;
	justify-content: center;
	align-items: center;
}

.welcome {
	display: flex;
	align-items: center;
	gap: .5ch;
	font-size: 2.5rem;
}

.profile-picture {
	width: 1em;
	height: 1em;
	border-radius: 100%;
	background-color: var(--color-card-background);
}
</style>

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
			<button @click="createBoard">
				+ Create Board
			</button>
			<button
				style="color: red"
				@click="logout"
			>
				&lt; Log Out
			</button>
			<div class="text-secondary">
				User ID: {{ user.id }}
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
// https://github.com/Atinux/nuxt-todos-edge/blob/main/pages/todos.vue

definePageMeta({
	middleware: 'auth'
})

const session = useUserSession()
const { user } = session
const boards = (await useFetch('/api/boards', { method: 'GET' })).data.value as any

async function createBoard() {
	await $fetch('/api/boards', { method: 'POST' })

	// eslint-disable-next-line no-self-assign
	window.location.href = window.location.href
}

async function logout() {
	await session.clear()
}
</script>
