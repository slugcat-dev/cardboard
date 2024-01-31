<script setup lang="ts">
const session = useUserSession()
const { user } = session
const settings = useSettings()

const { boards, createBoard } = await useBoards()
const rootBoards = computed(() => boards.value?.filter(board => !board.parent))

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
				{{ user.name }}
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
				@click="createBoard({ open: true })"
			>
				Create Board
			</Btn>
		</div>
		<div class="boards">
			<div
				v-for="board of boards"
				:key="board.id"
				class="board"
				:style="{ opacity: rootBoards?.map(board => board.id).includes(board.id) ? 1 : .5 }"
			>
				<NuxtLink class="board-link" :to="board.id">
					<IconCSS
						name="fluent:page-20-regular"
						size="20px"
					/>
					<IconCSS
						name="fluent:page-20-filled"
						size="20px"
					/>
					<span>
						{{ board.name }}
					</span>
				</NuxtLink>
			</div>
		</div>
	</div>
</template>

<style lang="scss">
.list-loader {
	display: flex;
	flex-direction: column;
	gap: .5rem;
	padding-inline: 1rem;

	.skeleton-loader {
		height: 2rem;
		border-radius: .375rem;
	}
}

#sidebar {
	z-index: 10;
	display: flex;
	flex-direction: column;
	grid-area: sidebar;
	gap: 1rem;
	width: 240px;
	margin-left: 0;
	padding: .5rem;
	overflow-y: auto;
	background-color: var(--color-background-secondary);
	border-right: 1px solid var(--color-background-secondary);
	box-shadow: 2px 0 4px var(--color-shadow-ui);
	transition: margin-left .2s, box-shadow .2s;
	user-select: none;

	&::after {
		position: fixed;
		top: 40px;
		left: 239px;
		width: 1px;
		height: 100vh;
		background-color: var(--color-border);
		transition: left .2s;
		content: '';
	}

	&.hidden{
		margin-left: -240px;
		box-shadow: none;

		&::after {
			left: -1px;
		}
	}

	.profile {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem .5rem;
		align-items: center;
		padding-top: .5rem;
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

		&::-webkit-scrollbar {
			width: 0;
			height: 0;
		}
	}
}

.board-link {
	display: block;
	padding: .5rem;
	overflow: hidden;
	color: currentcolor;
	white-space: nowrap;
	text-overflow: ellipsis;
	border-radius: .375rem;

	span {
		vertical-align: middle;
	}

	span:last-child {
		margin-left: .25rem;
	}

	&:hover {
		text-decoration: none;
		background-color: #8882;
	}

	:nth-child(2) {
		display: none;
	}

	&.router-link-active {
		background-color: #8884;

		:first-child {
			display: none;
		}

		:nth-child(2) {
			display: inline-block;
		}
	}

	&:not(.router-link-active) {
		color: var(--color-text-tertiary);
	}
}
</style>
