<script setup lang="ts">
const session = useUserSession()
const { user } = session
const boards = (await useFetch('/api/boards', { method: 'GET' })).data.value as any
const hidden = ref(false)

async function createBoard() {
	await $fetch('/api/boards', { method: 'POST' })

	// eslint-disable-next-line no-self-assign
	window.location.href = window.location.href
}
/*
function match() {
	return window.matchMedia('(width <= 480px)').matches
}
*/

function onToggleSidebar() {
	hidden.value = !hidden.value
}
</script>

<template>
	<div
		id="sidebar"
		:class="{ hidden }"
	>
		<button
			class="sidebar-toggle"
			@click="onToggleSidebar"
		>
			#
		</button>
		<div
			class="profile"
			@click="session.clear()"
		>
			<img
				class="profile-picture"
				:src="user.picture"
				draggable="false"
			>
			{{ user.name }}
		</div>
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
			@click="createBoard"
		>
			Create Board
		</Btn>
	</div>
</template>

<style lang="scss">
#sidebar {
	min-width: 220px;
	height: 100%;
	margin-left: 0;
	padding: .5rem;
	background-color: var(--color-background-secondary);
	border-right: 1px solid var(--color-border);
	transition: margin-left .2s;

	&.hidden{
		margin-left: -220px;
	}

	.sidebar-toggle {
		position: fixed;
		bottom: 1rem;
		left: 1rem;
		z-index: 25;
	}

	.profile {
		display: flex;
		gap: .5rem;
		align-items: center;
		font-weight: bold;
		cursor: pointer;

		.profile-picture {
			width: 1.5rem;
			height: 1.5rem;
			background-color: var(--color-scrollbar);
			border-radius: 100%;
		}
	}
}
</style>
