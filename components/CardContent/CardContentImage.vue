<script setup lang="ts">
defineProps(['card'])

const emit = defineEmits(['contentUpdate'])
const active = ref(false)

function activate() {
	active.value = true
}

function onClick(event: MouseEvent) {
	if (!active.value)
		return

	active.value = false

	event.stopPropagation()
	emit('contentUpdate')
}

defineExpose({ activate })
</script>

<template>
	<div
		class="card-image"
		:class="{ active }"
		@click.left="onClick"
	>
		<img
			:src="card.content"
			:draggable="active"
			loading="lazy"
		>
	</div>
</template>

<style lang="scss">
.card-image {
	&:not(.active) {
		max-width: 334px;
		max-height: 334px;

		& > img {
			display: block;
			width: auto;
			max-width: 334px;
			height: auto;
			max-height: 334px;
			border-radius: .25rem;
			-webkit-touch-callout: none;
		}
	}

	&.active {
		position: fixed;
		z-index: 5;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		padding-top: 4.875rem;
		background-color: black;
		inset: 0;

		& > img {
			width: auto;
			max-width: 100%;
			max-height: 100%;
		}
	}
}
</style>
