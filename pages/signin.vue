<script setup lang="ts">
const { loggedIn } = useUserSession()
const redirecting = ref(false)

if (loggedIn.value)
	await navigateTo('/')

function signin(provider: string) {
	redirecting.value = true

	navigateTo(`/signin/${provider}`, { external: true })
}
</script>

<template>
	<div id="signin">
		<h1>SIGN IN</h1>
		<ButtonIcon
			class="large"
			icon="mdi:google"
			large
			:disabled="redirecting"
			@click="signin('google')"
		>
			Google
		</ButtonIcon>
		<ButtonIcon
			class="large"
			icon="mdi:github"
			large
			:disabled="redirecting"
			@click="signin('github')"
		>
			GitHub
		</ButtonIcon>
	</div>
</template>

<style>
#signin {
	display: flex;
	flex-direction: column;
	width: 140px;
	height: 100vh;
	gap: .5rem;
	margin: auto;
	justify-content: center;
	user-select: none;

	h1 {
		margin: 0;
		margin-bottom: .5rem;
		line-height: 2rem;
		text-align: center;
	}
}
</style>
