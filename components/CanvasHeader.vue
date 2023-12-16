<style lang="scss">
#header {
	display: flex;
	position: fixed;
	top: 0;
	left: 0;
	width: calc(100vw - .5rem);
	margin: .25rem;
	padding: .5rem 1rem;
	justify-content: space-between;
	align-items: flex-start;
	background-color: var(--color-card-background);
	border: 1px solid var(--color-card-border);
	border-radius: .5rem;
	box-shadow: var(--shadow-card);
	z-index: 10;
	user-select: none;
	-webkit-user-select: none;
	pointer-events: none;

	.toolbar {
		display: flex;
		gap: 1rem;
		align-items: center;
		font-size: .875rem;
		font-weight: 500;

		.option,
		.option > input[type="checkbox"] {
			cursor: pointer;
		}
	}

	.profile {
		display: flex;
		align-items: center;
		gap: .5rem;
		cursor: pointer;

		.profile-picture {
			width: 1.5rem;
			height: 1.5rem;
			padding: .125rem;
			background-color: var(--color-teal);
			border: 1px solid var(--color-card-border);
			border-radius: 100%;
		}

		.dropdown-arrow {
			font-size: .75rem;
			opacity: .75;
		}
	}
}
</style>

<template>
	<header id="header">
		<div class="toolbar allow-pointer-events">
			<NuxtLink to="/">
				<Icon name="mdi:chevron-left" size="1.5rem" />
			</NuxtLink>
			<span>Workspace</span>
			<span style="opacity: .5;">/</span>
			<span style="font-family: monospace;">
				{{ useRoute().params.board }}
			</span>
			<div />
			<ClientOnly>
				<label class="option">
					<input
						type="checkbox"
						:checked="settings.grid.snap"
						@change="settings.grid.snap = ($event.target as HTMLInputElement).checked"
					>
					Snap cards to grid
				</label>
				<label class="option">
					<input
						type="checkbox"
						:checked="settings.grid.show"
						@change="settings.grid.show = ($event.target as HTMLInputElement).checked"
					>
					Show grid
				</label>
			</ClientOnly>
		</div>
		<div class="profile allow-pointer-events">
			<Icon
				class="profile-picture"
				name="mi:user"
			/>
			<span class="dropdown-arrow">▼</span>
		</div>
	</header>
</template>

<script setup lang="ts">
const settings = useSettings()
</script>
