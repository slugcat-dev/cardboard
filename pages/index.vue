<script setup lang="ts">
const session = useUserSession()
const { user } = session

definePageMeta({
	middleware: ['auth', 'breadcrumbs'],
	pageTransition: { name: 'slide' },
	layout: 'board'
})
</script>

<template>
	<div class="dash">
		<div>
			<h1 class="welcome">
				Hey {{ user.name }}!
			</h1>
			<div class="text-secondary">
				User ID: {{ user.id }}
			</div>
			<main class="outbox">
				<div class="empty">
					<ClientIcon name="lucide:download" size="64px" />
					<h1>Inbox</h1>
				</div>
				<div class="input">
					<input autocomplete="off" spellcheck="false">
					<button>Send</button>
				</div>
			</main>
		</div>
	</div>
</template>

<style>
.dash {
	position: absolute;
	display: flex;
	flex-direction: column;
	grid-area: main;
	align-items: center;
	width: 100%;
}

.welcome {
	display: flex;
	gap: .5ch;
	align-items: center;
	font-size: 1.5rem;
}

.profile-picture {
	width: 1em;
	height: 1em;
	background-color: var(--color-background-secondary);
	border-radius: 100%;
}

.outbox {
	opacity: .25;

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.input {
		position: fixed;
		bottom: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;

		input, button {
			padding: 1rem;
		}
	}
}
</style>
