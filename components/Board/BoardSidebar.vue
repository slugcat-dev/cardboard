<script setup lang="ts">
const session = useUserSession()
const { user } = session
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
		</div>
		<ClientOnly>
			<template #fallback>
				<div class="list-loader">
					<div class="skeleton-loader" />
					<div class="skeleton-loader" />
					<div class="skeleton-loader" />
					<div class="skeleton-loader" />
					<div class="skeleton-loader" />
				</div>
			</template>
			<BoardList />
		</ClientOnly>
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
	width: 240px;
	margin-left: 0;
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
		padding: 1rem;
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
