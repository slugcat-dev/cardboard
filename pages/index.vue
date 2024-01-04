<script setup lang="ts">
const { loggedIn } = useUserSession()
const signinButtonGoogle = ref()
const signinButtonGithub = ref()

function login(provider: string) {
	signinButtonGoogle.value.disabled = true
	signinButtonGithub.value.disabled = true

	navigateTo(`/signin/${provider}`, { external: true })
}
</script>

<template>
	<main>
		<div v-if="loggedIn">
			<NuxtLink to="/boards">
				Dashboard
			</NuxtLink>
		</div>
		<div v-else>
			<h1>Sign In</h1>
			<div class="signin">
				<button
					ref="signinButtonGoogle"
					class="signin-button"
					@click="login('google')"
				>
					<Icon
						name="mdi:google"
						size="1.5rem"
					/>
					Google
				</button>
				<button
					ref="signinButtonGithub"
					class="signin-button"
					@click="login('github')"
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

<style lang="scss">
main {
	display: flex;
	height: 100vh;
	justify-content: center;
	align-items: center;
}

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
		color: currentcolor;
		background-color: transparent;
		border: 1px solid gray;
		border-radius: .375rem;
		box-shadow: var(--color-scrollbar) 0 1px;
		transition: box-shadow .2s;
		cursor: pointer;

		&:disabled {
			opacity: .75;
			cursor: not-allowed;
		}

		&:hover:not(:disabled) {
			box-shadow: var(--color-scrollbar) 0 0 0 2px;
		}
	}
}
</style>
