<style>
	.center {
		display: flex;
		height: 100vh;
		justify-content: center;
		align-items: center;
	}
</style>

<template>
	<div class="center">
		<div v-if="user">
			<h1>Hello, {{ user?.name }}</h1>
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
			<div
				id="g_id_onload"
				:data-client_id="googleClientId"
				data-ux_mode="redirect"
				data-login_uri="https://pinwall.doublekekse.dev/api/login/google"
			/>
			<div
				class="g_id_signin"
				data-type="standard"
				data-locale="en_US"
				data-text="signin"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import '~/assets/style.scss'

const googleClientId = process.env.GOOGLE_CLIENT_ID
const user = (await useFetch('/api/me', { method: 'GET' })).data.value as User | null
const boards = (await useFetch('/api/boards', { method: 'GET' })).data.value as any

async function createBoard() {
	await $fetch('/api/boards/create', { method: 'POST' })

	// eslint-disable-next-line no-self-assign
	window.location.href = window.location.href
}

async function logout() {
	window.location.href = 'https://pinwall.doublekekse.dev/api/logout'
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
