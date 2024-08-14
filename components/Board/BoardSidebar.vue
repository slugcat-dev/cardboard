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
			<ButtonIcon
				icon="mdi:logout"
				@click="session.clear()"
			>
				Log Out
			</ButtonIcon>
		</div>
		<BoardList />
	</div>
</template>

<style>
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
	display: flex;
	flex-direction: column;
	grid-area: sidebar;
	gap: 1rem;
	width: 240px;
	margin-left: 0;
	padding: .5rem;
	overflow-y: auto;
	background-color: var(--color-background-secondary);
	border-right: 1px solid var(--color-border);
	transition: margin-left .2s, box-shadow .2s;
	user-select: none;

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
}
</style>
