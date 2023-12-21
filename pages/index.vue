<style lang="scss">
	main {
		display: flex;
		height: 100vh;
		justify-content: center;
		align-items: center;
	}

	/* !-- */
	.signin {
		display: flex;
		flex-direction: column;
		gap: .75rem;
		user-select: none;

		.signin-button {
			display: flex;
			width: 250px;
			justify-content: center;
			align-items: center;
			gap: .75rem;
			padding: .75rem;
			font-size: 1rem;
			font-weight: bold;
			color: currentColor;
			background-color: transparent;
			border: 1px solid gray;
			border-radius: .375rem;
			box-shadow: var(--color-scrollbar) 0px 1px;
			transition: box-shadow .2s;
			cursor: pointer;

			&:hover {
				box-shadow: var(--color-scrollbar) 0px 0px 0px 2px;
			}
		}
	}

	/* !-- */
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
		<div v-if="loggedIn">
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
					:key="board._id"
				>
					<NuxtLink :to="board._id">
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
		</div>
		<div v-else>
			<h1>Sign In</h1>
			<div class="signin">
				<button
					class="signin-button"
					@click="navigateTo('/auth/google', { external: true })"
				>
					<Icon
						name="mdi:google"
						size="1.5rem"
					/>
					Google
				</button>
				<button
					class="signin-button"
					@click="navigateTo('/auth/github', { external: true })"
				>
					<Icon
						name="mdi:github"
						size="1.5rem"
					/>
					GitHub
				</button>
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
const session = useUserSession()
const { loggedIn, user } = session
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
