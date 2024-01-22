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
			<Btn
				icon="mdi:logout"
				@click="session.clear()"
			>
				Log Out
			</Btn>
			<Btn
				role="primary"
				icon="mdi:plus"
				@click="createBoard(true)"
			>
				Create Board
			</Btn>
		</div>
		<div class="boards">
			<strong style="position: sticky; top: 0; left: 0; display: block; width: 100%; padding-left: 1rem; background-color: var(--color-background-secondary);">Your Boards</strong>
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
	</div>
</template>

<style lang="scss">
#sidebar {
	z-index: 10;
	display: flex;
	flex-direction: column;
	grid-area: sidebar;
	width: 240px;
	margin-left: 0;
	overflow-y: auto;
	background-color: var(--color-background-secondary);
	border-right: 1px solid var(--color-border);
	box-shadow: 2px 0 4px var(--color-shadow-ui);
	transition: margin-left .2s, box-shadow .2s;
	user-select: none;

	&.hidden{
		margin-left: -240px;
		box-shadow: none;
	}

	.profile {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem .5rem;
		align-items: center;
		padding: 1rem;
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

	.boards {
		flex-direction: column;
		overflow-y: scroll;

		&:not(:hover) {
			&::-webkit-scrollbar {
				width: 0;
				height: 0;
			}
		}
	}
}

.board {
	border-top: 1px solid var(--color-border);

	&:has(.router-link-active),
	&:has(.router-link-active) + .board {
		border-color: var(--color-background);
	}

	&:last-child:has(.router-link-active) {
		border-bottom: 1px solid var(--color-background);
	}
}

.board-link {
	display: block;
	padding: .5rem 1rem;
	overflow: hidden;
	color: currentcolor;
	white-space: nowrap;
	text-overflow: ellipsis;

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
