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
</style>

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
const { loggedIn } = useUserSession()
</script>
