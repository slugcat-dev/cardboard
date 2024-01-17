<script setup lang="ts">
const session = useUserSession()
const { user } = session
const { boards, createBoard } = await useBoards()
const settings = useSettings()
const hidden = computed(() => {
	if (process.client)
		return !settings.value.sidebar

	return true
})

/*
function match() {
	return window.matchMedia('(width <= 480px)').matches
}
*/
</script>

<template>
	<div
		id="sidebar"
		:class="{ hidden }"
	>
		<div class="profile">
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
			@click="createBoard(true)"
		>
			Create Board
		</Btn>
		<Btn
			role="danger"
			icon="mdi:logout"
			@click="session.clear()"
		>
			Log Out
		</Btn>
	</div>
</template>

<style lang="scss">
#sidebar {
	z-index: 10;
	min-width: 220px;
	height: 100%;
	margin-left: 0;
	padding: .5rem;
	background-color: var(--color-background-secondary);
	border-right: 1px solid var(--color-border);
	box-shadow: 2px 0 4px var(--color-shadow-ui);
	transition: margin-left .2s, box-shadow .2s;
	user-select: none;

	&.hidden{
		margin-left: -220px;
		box-shadow: none;
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
