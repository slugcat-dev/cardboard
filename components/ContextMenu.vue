<script setup lang="ts">
const position = computed(() => {
	const style = {
		top: 'auto',
		right: 'auto',
		bottom: 'auto',
		left: 'auto'
	}

	if (contextMenu.position.x > window.innerWidth / 2)
		style.right = `${window.innerWidth - contextMenu.position.x}px`
	else style.left = `${contextMenu.position.x}px`

	if (contextMenu.position.y > window.innerHeight / 2)
		style.bottom = `${window.innerHeight - contextMenu.position.y}px`
	else style.top = `${contextMenu.position.y}px`

	return style
})
</script>

<template>
	<Teleport to="body">
		<div
			v-if="contextMenu.visible"
			class="context-menu-overlay"
			@pointerdown.self="contextMenu.visible = false"
			@contextmenu.prevent
		>
			<div
				class="context-menu"
				:style="position"
				@click="contextMenu.visible = false"
			>
				<div
					v-for="item, index in contextMenu.items"
					:key="index"
					class="context-menu-item"
					@pointerup="item.handler"
				>
					<ClientIcon
						:name="item.icon"
						size="1rem"
					/>
					{{ item.name }}
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style lang="scss">
.context-menu-overlay {
	position: fixed;
	z-index: 1;
	user-select: none;
	inset: 0;
}

.context-menu {
	position: fixed;
	display: flex;
	flex-direction: column;
	padding: .25rem;
	background-color: #333;
	border: 1px solid #444;
	border-radius: .375rem;
	box-shadow: 0 4px 14px #0008;
	transform-origin: bottom right;

	.context-menu-item {
		display: flex;
		gap: .5rem;
		align-items: center;
		padding: .125rem .25rem;
		font-size: .875rem;
		border-radius: .25rem;

		&:hover {
			background-color: #444;
		}
	}
}
</style>
