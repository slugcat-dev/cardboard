<script setup lang="ts">
const session = useUserSession()
const { user } = session
const { boards, createBoard } = await useBoards()
const settings = useSettings()
/*
function match() {
	return window.matchMedia('(width <= 480px)').matches
}
*/
</script>

<template>
	<div
		id="sidebar"
		:class="{ hidden: !settings.sidebar }"
	>
		<div class="profile">
			<img
				class="profile-picture"
				:src="user.picture"
				draggable="false"
			>
			<div class="info">
				Good evening, {{ user.name }}!
				<div class="text-secondary">
					{{ user.email }}
				</div>
			</div>
		</div>
		<Btn
			icon="mdi:logout"
			@click="session.clear()"
		>
			Log Out
		</Btn>
		<strong><br>Your Boards</strong>
		<div class="boards">
			<div
				v-for="board of boards"
				:key="board.id"
				class="board"
			>
				<NuxtLink class="board-link" :to="board.id">
					<Icon
						name="fluent:page-20-regular"
						size="20px"
					/>
					{{ board.name }}
				</NuxtLink>
			</div>
		</div>
		<Btn
			role="primary"
			icon="mdi:plus"
			@click="createBoard(true)"
		>
			Create Board
		</Btn>
	</div>
</template>

<style lang="scss">
#sidebar {
	z-index: 10;
	display: flex;
	flex-direction: column;
	gap: .25rem;
	width: 240px;
	height: 100%;
	margin-left: 0;
	padding: .5rem .75rem;
	overflow-y: auto;
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
		font-size: .875rem;
		background-color: var(--color-background-secondary);

		.info {
			line-height: 1em;

			.text-secondary {
				font-weight: normal;
				font-size: .625rem;
			}
		}

		.profile-picture {
			width: 1.5rem;
			height: 1.5rem;
			background-color: var(--color-scrollbar);
			border-radius: 100%;
		}
	}
}

.board-link {
	display: block;
	padding: .5rem 0;
	overflow: hidden;
	color: currentcolor;
	white-space: nowrap;
	text-overflow: ellipsis;
	border-radius: .375rem;

	&:hover {
		text-decoration: none;
	}

	&.router-link-active {
		background-color: var(--color-background-tertiary);
	}

	&:not(.router-link-active) {
		color: var(--color-text-tertiary);
	}
}
</style>
