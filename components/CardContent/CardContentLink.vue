<script setup lang="ts">
const { card } = defineProps(['card'])
const title = computed(() => {
	return `${card.content.siteName && !card.content.title.includes(card.content.siteName)
		? `${card.content.siteName} - ` : ''}${card.content.title || card.content.domain}`
})
const showImage = /youtube|spotify/.test(card.content.url)
</script>

<template>
	<div class="card-content card-content-link">
		<div class="favicon">
			<img
				v-if="card.content.favicon"
				:src="card.content.favicon"
				draggable="false"
				loading="lazy"
			>
			<ClientIcon
				v-else
				name="mdi:earth"
			/>
		</div>
		<div class="text">
			<NuxtLink
				class="title text-strong"
				:to="card.content.url"
				target="_blank"
			>
				{{ title }}
			</NuxtLink>
			<div class="text text-secondary">
				{{ card.content.domain }}
			</div>
		</div>
		<img
			v-if="showImage && card.content.image"
			class="image"
			:src="card.content.image"
			draggable="false"
			loading="lazy"
		>
	</div>
</template>

<style lang="scss">
.card-content-link {
	display: flex;
	gap: .375rem;
	align-items: center;
	width: 250px;
	padding: .375rem;
	font-size: .875rem;
	background-color: #222;
	border: 2px solid var(--color-border);
	border-radius: .375rem;
	box-shadow: var(--shadow-card);

	.favicon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background-color: #333;
		border-radius: .375rem;
		box-shadow: var(--shadow-card);

		img,
		svg {
			width: 1.25rem;
			height: 1.25rem;
			-webkit-touch-callout: none;
		}
	}

	.text {
		display: flex;
		flex-direction: column;
		width: calc(100% - 2.5rem);

		.title,
		.text {
			width: fit-content;
			max-width: 100%;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		.title {
			color: currentcolor;
		}
	}

	.image {
		position: absolute;
		left: 0;
		bottom: 3.875rem;
		width: 100%;
		height: 8rem;
		border-radius: .375rem;
		object-fit: cover;
		-webkit-touch-callout: none;
		border: inherit;
		background-color: #222;
	}
}
</style>
