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
		class="card-content card-content-image"
		:src="card.content"
		draggable="false"
		@click.left.exact="activate"
	>
	<ClientOnly>
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
	</ClientOnly>
</template>

<style>
.card-content-image {
	display: block;
	width: auto;
	max-width: 550px;
	height: auto;
	max-height: 350px;
	background-color: #222;
	border-radius: .375rem;
	border: 2px solid var(--color-border);
	box-shadow: var(--shadow-card);
	-webkit-touch-callout: none;
}

.image-preview {
	position: fixed;
	z-index: 10;
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
