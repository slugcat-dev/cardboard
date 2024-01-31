<script setup lang="ts">
import type { Point } from 'puppeteer-core'

const { contextMenu } = useContextMenu()

function fhandler(handler: Function) {
	handler()

	contextMenu.value = undefined
}

const menuStyle = computed(() => {
	const style = {}

	if (contextMenu.value.position.x > window.innerWidth / 2)
		style.right = `${window.innerWidth - contextMenu.value.position.x}px`
	else style.left = `${contextMenu.value.position.x}px`

	if (contextMenu.value.position.y > window.innerHeight / 2)
		style.bottom = `${window.innerHeight - contextMenu.value.position.y}px`
	else style.top = `${contextMenu.value.position.y}px`

	return style
})
</script>

<template>
	<div
		v-if="contextMenu"
		class="context-menu-overlay"
		@pointerdown.self.prevent="() => { contextMenu = undefined }"
	/>
	<div
		v-if="contextMenu"
		class="context-menu"
		:style="menuStyle"
	>
		<div
			v-for="entry, index in contextMenu.entries"
			:key="index"
			class="menu-option"
			:class="{ danger: entry.role === 'danger' }"
			@click="fhandler(entry.handler)"
		>
			{{ entry.name }}
		</div>
	</div>
</template>

<style lang="scss">
.context-menu-overlay {
	position: fixed;
	z-index: 30;
	isolation: isolate;
	inset: 0;
	user-select: none;
}

.context-menu {
	position: fixed;
	z-index: 30;
	display: flex;
	flex-direction: column;
	padding: .25rem;
	background-color: color-mix(in srgb, var(--color-background-secondary), transparent 40%);
	border: 1px solid var(--color-scrollbar);
	border-radius: .375rem;
	box-shadow: var(--shadow-card);
	backdrop-filter: blur(8px);
	user-select: none;

	.menu-option {
		display: flex;
		gap: .75rem;
		align-items: center;
		min-width: 100px;
		padding: .125rem .5rem;
		font-weight: bold;
		font-size: .875rem;
		text-align: left;
		border-radius: .25rem;

		&:hover {
			background-color: var(--color-accent-25);
		}

		&.danger {
			color: var(--color-danger);

			&:hover {
				background-color: var(--color-danger-25);
			}
		}
	}
}
</style>
