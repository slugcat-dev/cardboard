<script setup lang="ts">
const { contextMenu } = useContextMenu()

function onClose(event: MouseEvent) {
	if (!event.target.classList.contains('wrapper'))
		return

	contextMenu.options = undefined
}

function fhandler(handler: Function) {
	handler()

	contextMenu.options = undefined
}

const menuStyle = computed(() => {
	const style = {}

	if (contextMenu.options.position.x > window.innerWidth / 2)
		style.right = `${window.innerWidth - contextMenu.options.position.x}px`
	else style.left = `${contextMenu.options.position.x}px`

	if (contextMenu.options.position.y > window.innerHeight / 2)
		style.bottom = `${window.innerHeight - contextMenu.options.position.y}px`
	else style.top = `${contextMenu.options.position.y}px`

	return style
})
</script>

<template>
	<Transition name="page">
		<div
			v-if="contextMenu.options"
			class="wrapper"
			@mousedown.prevent="onClose"
		/>
	</Transition>
	<Transition name="page">
		<div
			v-if="contextMenu.options"
			class="context-menu"
			:style="menuStyle"
		>
			<button
				v-for="entry, index in contextMenu.options.entries"
				:key="index"
				@click="fhandler(entry.handler)"
			>
				{{ entry.name }}
			</button>
		</div>
	</Transition>
</template>

<style>
.wrapper {
	position: fixed;
	inset: 0;
	background-color: #0008;
	z-index: 18;
	isolation: isolate;
}

.context-menu {
	display: flex;
	flex-direction: column;
	gap: .25rem;
	position: fixed;
	padding: .25rem;
	background-color: var(--color-background-secondary);
	border: 1px solid var(--color-border);
	border-radius: .25rem;
	box-shadow: var(--shadow-card);
	z-index: 30;
}
</style>
