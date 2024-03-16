<script setup lang="ts">
defineProps(['card'])

const emit = defineEmits(['activate'])
const active = ref(false)

function activate() {
	active.value = true

	emit('activate')
}

defineExpose({ active })
</script>

<template>
	<img
		class="card-content-image"
		:src="card.content"
		draggable="false"
		@click.left.exact="activate"
	>
	<Teleport to="body">
		<Transition name="image-preview">
			<div
				v-if="active"
				class="image-preview"
				@click="active = false"
			>
				<img :src="card.content">
			</div>
		</Transition>
	</Teleport>
</template>

<style lang="scss">
.card-content-image {
	width: auto;
	max-width: 550px;
	height: auto;
	max-height: 350px;
	background-color: var(--color-background);
	border-radius: .375rem;
	outline: 2px solid var(--color-border);
	outline-offset: -2px;
	box-shadow: var(--shadow-card);
	-webkit-touch-callout: none;
}

.card.selected > .card-content-image {
	outline-color: var(--color-accent-50);
}

.image-preview {
	position: fixed;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	background-color: #000a;
	backdrop-filter: blur(8px);
	inset: 0;

	img {
		display: block;
		max-width: 100%;
		max-height: 100%;
	}
}

.image-preview-enter-active,
.image-preview-leave-active {
	transition: .4s;

	img {
		transition: .4s cubic-bezier(0.680, -0.550, 0.265, 1.550);
	}
}

.image-preview-enter-from,
.image-preview-leave-to {
  background-color: transparent;
	backdrop-filter: blur(0);

	img {
		opacity: 0;
		scale: .75;
	}
}
</style>
