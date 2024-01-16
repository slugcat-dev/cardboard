<script setup lang="ts">
const { loggedIn } = useUserSession()
const isLoading = ref(false)

if (loggedIn.value)
	await navigateTo('/')

function signin(provider: string) {
	isLoading.value = true

	navigateTo(`/signin/${provider}`, { external: true })
}
</script>

<template>
	<main>
		<div class="signin">
			<h1>Sign In</h1>
			<button
				class="signin-button"
				:disabled="isLoading"
				@click="signin('google')"
			>
				<Icon
					name="mdi:google"
					size="1.5rem"
				/>
				Google
			</button>
			<button
				class="signin-button"
				:disabled="isLoading"
				@click="signin('github')"
			>
				<Icon
					name="mdi:github"
					size="1.5rem"
				/>
				GitHub
			</button>
			<span>If you can not sign in, ask to join<br>by <a href="mailto:join@doublekekse.dev?subject=Request%20to%20join&body=Hey%2C%20I'd%20love%20to%20join%20the%20private%20beta%0A">sending an e-mail</a></span>
		</div>
	</main>
</template>

<style lang="scss">
main {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
}

.signin {
	display: flex;
	flex-direction: column;
	gap: .75rem;
	user-select: none;

	.signin-button {
		display: flex;
		gap: .75rem;
		align-items: center;
		justify-content: center;
		width: 250px;
		padding: .75rem;
		color: currentcolor;
		font-weight: bold;
		font-size: 1rem;
		background-color: transparent;
		border: 1px solid gray;
		border-radius: .375rem;
		box-shadow: var(--color-scrollbar) 0 1px;
		cursor: pointer;
		transition: box-shadow .2s;

		&:disabled {
			cursor: not-allowed;
			opacity: .5;
		}

		&:hover:not(:disabled) {
			box-shadow: var(--color-scrollbar) 0 0 0 2px;
		}
	}
}
</style>
