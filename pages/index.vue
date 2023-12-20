<style>
	.center {
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
	<div class="center">
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
			<!-- TODO: nuxt link says 404 -> https://github.com/Atinux/nuxt-auth-utils/issues/28 -->
			<a href="/auth/google">
				Login with Google
			</a>
			<a href="/auth/github">
				Login with GitHub
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import '~/assets/style.scss'

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

useHead({
	title: 'Pinwall v2',
	meta: [
		{
			name: 'description',
			content: 'Place virtual cards on a virtual canvas virtually anywhere'
		},
		{
			name: 'theme-color',
			media: '(prefers-color-scheme: dark)',
			content: '#101010'
		},
		{
			name: 'theme-color',
			media: '(prefers-color-scheme: light)',
			content: '#f3f3f3'
		}
	],
	link: [
		{
			rel: 'manifest',
			href: 'manifest.json'
		},
		{
			rel: 'stylesheet',
			href: 'https://fonts.googleapis.com/css?family=Roboto:400,700|JetBrains+Mono:400,700&display=swap'
		}
	],
	script: [{
		src: 'https://accounts.google.com/gsi/client',
		defer: true,
		async: true
	}]
})
</script>
